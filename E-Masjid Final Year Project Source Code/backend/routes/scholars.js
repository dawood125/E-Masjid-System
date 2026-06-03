const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

// GET /api/scholars - List scholars (admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const scholars = await User.find({ role: 'scholar', mosqueId: req.user.mosqueId }).select('-password');
    res.json({ success: true, data: scholars });
  } catch (error) { next(error); }
});

// POST /api/scholars - Create scholar account (admin)
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
    body('email').isString().trim().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
    body('specialization').optional().isString().trim().isLength({ min: 2, max: 100 }).withMessage('Invalid specialization'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const name = sanitizeString(req.body.name);
    const email = sanitizeString(req.body.email).toLowerCase();
    const phone = sanitizeString(req.body.phone || '');
    const specialization = sanitizeString(req.body.specialization || 'Nikah Services');
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const tempPassword = Math.random().toString(36).slice(-8);

    const scholar = await User.create({
      name, email, phone, password: tempPassword, role: 'scholar',
      mosqueId: req.user.mosqueId,
      specialization,
    });

    res.status(201).json({
      success: true,
      data: { id: scholar._id, name: scholar.name, email: scholar.email, phone: scholar.phone },
      message: 'Scholar account created',
    });
  } catch (error) { next(error); }
});

// PUT /api/scholars/:id - Toggle scholar active
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid scholar id' });
    }
    const scholar = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'scholar', mosqueId: req.user.mosqueId },
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    if (!scholar) return res.status(404).json({ success: false, message: 'Scholar not found' });
    res.json({ success: true, data: scholar });
  } catch (error) { next(error); }
});

module.exports = router;
