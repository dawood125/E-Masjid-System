const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/scholars - List scholars (admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const scholars = await User.find({ role: 'scholar' }).select('-password');
    res.json({ success: true, data: scholars });
  } catch (error) { next(error); }
});

// POST /api/scholars - Create scholar account (admin)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, phone, specialization } = req.body;
    const tempPassword = Math.random().toString(36).slice(-8);

    const scholar = await User.create({
      name, email, phone, password: tempPassword, role: 'scholar',
      mosqueId: req.user.mosqueId,
    });

    res.status(201).json({
      success: true,
      data: { id: scholar._id, name: scholar.name, email: scholar.email, phone: scholar.phone },
      tempPassword, // In production, send via email instead
    });
  } catch (error) { next(error); }
});

// PUT /api/scholars/:id - Toggle scholar active
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const scholar = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!scholar) return res.status(404).json({ success: false, message: 'Scholar not found' });
    res.json({ success: true, data: scholar });
  } catch (error) { next(error); }
});

module.exports = router;
