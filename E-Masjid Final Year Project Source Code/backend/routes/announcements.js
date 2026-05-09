const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');

// GET /api/announcements - Public
router.get('/', async (req, res, next) => {
  try {
    const { mosqueId } = req.query;
    const query = mosqueId ? { mosqueId } : {};
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) { next(error); }
});

// POST /api/announcements - Admin
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const announcement = await Announcement.create({ ...req.body, mosqueId: req.user.mosqueId });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) { next(error); }
});

// PUT /api/announcements/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: announcement });
  } catch (error) { next(error); }
});

// DELETE /api/announcements/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
