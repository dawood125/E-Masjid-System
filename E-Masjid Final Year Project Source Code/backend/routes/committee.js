const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/committee - List committee members (admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const members = await User.find({ role: 'committee' }).select('-password');
    res.json({ success: true, data: members });
  } catch (error) { next(error); }
});

// POST /api/committee - Create committee member (admin)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const tempPassword = Math.random().toString(36).slice(-8);

    const member = await User.create({
      name, email, phone, password: tempPassword, role: 'committee',
      mosqueId: req.user.mosqueId,
    });

    // In production, send credentials via email
    res.status(201).json({
      success: true,
      data: { id: member._id, name: member.name, email: member.email, phone: member.phone },
      tempPassword,
    });
  } catch (error) { next(error); }
});

// PUT /api/committee/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const member = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    res.json({ success: true, data: member });
  } catch (error) { next(error); }
});

// DELETE /api/committee/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Member removed' });
  } catch (error) { next(error); }
});

module.exports = router;
