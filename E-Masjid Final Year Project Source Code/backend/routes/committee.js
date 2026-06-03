const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

// GET /api/committee - List committee members (admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const members = await User.find({ role: 'committee', mosqueId: req.user.mosqueId }).select('-password');
    res.json({ success: true, data: members });
  } catch (error) { next(error); }
});

// POST /api/committee - Create committee member (admin)
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
    body('email').isString().trim().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const name = sanitizeString(req.body.name);
    const email = sanitizeString(req.body.email).toLowerCase();
    const phone = sanitizeString(req.body.phone || '');
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const tempPassword = Math.random().toString(36).slice(-8);

    const member = await User.create({
      name, email, phone, password: tempPassword, role: 'committee',
      mosqueId: req.user.mosqueId,
    });

    // In production, send credentials via email
    res.status(201).json({
      success: true,
      data: { id: member._id, name: member.name, email: member.email, phone: member.phone },
      message: 'Committee member created',
    });
  } catch (error) { next(error); }
});

// PUT /api/committee/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid member id' });
    }
    const member = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'committee', mosqueId: req.user.mosqueId },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (error) { next(error); }
});

// DELETE /api/committee/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid member id' });
    }
    const member = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'committee',
      mosqueId: req.user.mosqueId,
    });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    res.json({ success: true, message: 'Member removed' });
  } catch (error) { next(error); }
});

module.exports = router;
