const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const { protect, authorize } = require('../middleware/auth');
const stripeLib = require('stripe');
const { body, query } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

// @route   GET /api/donations
// @desc    Get all donations (public for transparency)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { type, month, page = 1, limit = 10, mosqueId } = req.query;
    const query = {};
    if (mosqueId) {
      if (!isValidObjectId(mosqueId)) {
        return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
      }
      query.mosqueId = mosqueId;
    }

    if (type && type !== 'all') query.type = new RegExp(type, 'i');
    if (month && month !== 'all') {
      const monthIndex = new Date(`${month} 1, 2026`).getMonth();
      query.$expr = { $eq: [{ $month: '$createdAt' }, monthIndex + 1] };
    }

    const total = await Donation.countDocuments(query);
    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mask anonymous donor names
    const publicDonations = donations.map((d) => {
      const obj = d.toObject();
      if (obj.isAnonymous) {
        obj.donorName = 'Anonymous';
        obj.email = '';
        obj.phone = '';
      }
      return obj;
    });

    res.json({ success: true, data: publicDonations, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/donations/top-donors
// @desc    Get top donors leaderboard
// @access  Public
router.get('/top-donors', async (req, res, next) => {
  try {
    const { mosqueId } = req.query;
    const mongoose = require('mongoose');
    if (mosqueId && !isValidObjectId(mosqueId)) {
      return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
    }
    const match = {
      isAnonymous: false,
      ...(mosqueId ? { mosqueId: mongoose.Types.ObjectId.createFromHexString(mosqueId) } : {}),
    };
    const topDonors = await Donation.aggregate([
      { $match: match },
      { $group: { _id: '$donorName', totalAmount: { $sum: '$amount' }, donationCount: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      { $project: { name: '$_id', totalAmount: 1, donationCount: 1, _id: 0 } },
    ]);

    const ranked = topDonors.map((d, i) => ({ ...d, rank: i + 1 }));
    res.json({ success: true, data: ranked });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/donations/summary
// @desc    Get financial summary
// @access  Public
router.get('/summary', async (req, res, next) => {
  try {
    const { mosqueId } = req.query;
    if (mosqueId && !isValidObjectId(mosqueId)) {
      return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
    }
    const match = mosqueId ? { mosqueId: require('mongoose').Types.ObjectId.createFromHexString(mosqueId) } : {};
    const totalResult = await Donation.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const byType = await Donation.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalDonations: totalResult[0]?.total || 0,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.total;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/donations
// @desc    Add a donation (admin - cash donations)
// @access  Private (admin)
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('donorName').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Donor name is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('type').isIn(['Zakat', 'Sadaqah', 'Mosque Fund', 'Ramadan', 'Wedding']).withMessage('Invalid donation type'),
    body('paymentMethod').optional().isIn(['Cash', 'Card', 'Online']).withMessage('Invalid payment method'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const donation = await Donation.create({
      ...req.body,
      donorName: sanitizeString(req.body.donorName),
      mosqueId: req.user.mosqueId,
    });
    res.status(201).json({ success: true, data: donation });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/donations/online
// @desc    Create an online donation (via Stripe)
// @access  Public (user doesn't need to be logged in to donate)
router.post(
  '/online',
  [
    body('donorName').optional().isString().trim().isLength({ min: 2, max: 100 }).withMessage('Invalid donor name'),
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Invalid email'),
    body('phone').optional({ nullable: true }).isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('type').optional().isIn(['Zakat', 'Sadaqah', 'Mosque Fund', 'Ramadan', 'Wedding']).withMessage('Invalid donation type'),
    body('mosqueId').optional({ nullable: true, checkFalsy: true }).custom((v) => isValidObjectId(v)).withMessage('Invalid mosqueId'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const { donorName, email, phone, amount, type, isAnonymous, mosqueId } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum donation amount is PKR 100' });
    }

    // Legacy fallback (non-stripe) if no Stripe key set
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_test_key_here')) {
      const donation = await Donation.create({
        donorName: sanitizeString(donorName || 'Online Donor'),
        email: sanitizeString(email || ''),
        phone: sanitizeString(phone || ''),
        amount: Number(amount),
        type: type || 'Mosque Fund',
        paymentMethod: 'Online',
        isAnonymous: isAnonymous || false,
        mosqueId,
      });

      return res.status(201).json({
        success: true,
        data: donation,
        transactionId: `TXN-${new Date().getFullYear()}-${donation._id.toString().slice(-5).toUpperCase()}`,
      });
    }

    const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name: `Donation (${type || 'Mosque Fund'})`,
              description: 'E-Masjid Online Donation',
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/donate?success=1`,
      cancel_url: `${process.env.CLIENT_URL}/donate?canceled=1`,
      metadata: {
        donorName: sanitizeString(donorName || 'Online Donor'),
        email: sanitizeString(email || ''),
        phone: sanitizeString(phone || ''),
        amount: String(amount),
        type: type || 'Mosque Fund',
        isAnonymous: String(!!isAnonymous),
        mosqueId: mosqueId || '',
      },
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
