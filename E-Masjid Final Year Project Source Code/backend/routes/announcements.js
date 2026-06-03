const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

// GET /api/announcements - Public
router.get('/', async (req, res, next) => {
  try {
    const { mosqueId } = req.query;
    if (mosqueId && !isValidObjectId(mosqueId)) {
      return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
    }
    const query = mosqueId ? { mosqueId } : {};
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) { next(error); }
});

// POST /api/announcements - Admin
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('title').isString().trim().isLength({ min: 3, max: 150 }).withMessage('Title is required'),
    body('content').isString().trim().isLength({ min: 5, max: 2000 }).withMessage('Content is required'),
    body('isUrgent').optional().isBoolean().withMessage('isUrgent must be boolean'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      title: sanitizeString(req.body.title),
      content: sanitizeString(req.body.content),
      mosqueId: req.user.mosqueId,
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) { next(error); }
});

// PUT /api/announcements/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid announcement id' });
    }
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, mosqueId: req.user.mosqueId },
      {
        ...req.body,
        ...(req.body.title ? { title: sanitizeString(req.body.title) } : {}),
        ...(req.body.content ? { content: sanitizeString(req.body.content) } : {}),
      },
      { new: true, runValidators: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: announcement });
  } catch (error) { next(error); }
});

// DELETE /api/announcements/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid announcement id' });
    }
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.id,
      mosqueId: req.user.mosqueId,
    });
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
