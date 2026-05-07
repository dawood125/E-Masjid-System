const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/donations
// @desc    Get all donations (public for transparency)
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const { type, month, page = 1, limit = 10 } = req.query;
    const query = {};

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
    const topDonors = await Donation.aggregate([
      { $match: { isAnonymous: false } },
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
    const totalResult = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const byType = await Donation.aggregate([
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
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const donation = await Donation.create({
      ...req.body,
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
router.post('/online', async (req, res, next) => {
  try {
    const { donorName, email, phone, amount, type, isAnonymous } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum donation amount is PKR 100' });
    }

    // In production, integrate Stripe checkout here
    // For now, create donation record directly
    const donation = await Donation.create({
      donorName: donorName || 'Online Donor',
      email,
      phone,
      amount,
      type: type || 'Mosque Fund',
      paymentMethod: 'Online',
      isAnonymous: isAnonymous || false,
    });

    res.status(201).json({
      success: true,
      data: donation,
      transactionId: `TXN-${new Date().getFullYear()}-${donation._id.toString().slice(-5).toUpperCase()}`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
