const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

// GET /api/announcements - Public
router.get('/', async (req, res, next) => {
  try {
    const { mosqueId, includeAll } = req.query;
    if (mosqueId && !isValidObjectId(mosqueId)) {
      return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
    }
    const query = mosqueId ? { mosqueId } : {};

    if (includeAll !== 'true') {
      query.status = { $ne: 'draft' };
      query.$or = [
        { publishDate: { $lte: new Date() } },
        { publishDate: { $exists: false } },
        { publishDate: null },
      ];
    }

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
    body('publishDate').optional().isISO8601().withMessage('Invalid publish date'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    if (req.body.publishDate) {
      const pubDate = new Date(req.body.publishDate);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      if (pubDate < todayMidnight) {
        return res.status(400).json({ success: false, message: 'Publication date cannot be in the past' });
      }
    }

    const announcement = await Announcement.create({
      title: sanitizeString(req.body.title),
      content: sanitizeString(req.body.content),
      isUrgent: req.body.isUrgent || false,
      publishedBy: req.body.publishedBy,
      publishDate: req.body.publishDate || undefined,
      status: req.body.status || 'published',
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

    if (req.body.publishDate) {
      const pubDate = new Date(req.body.publishDate);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      if (pubDate < todayMidnight) {
        return res.status(400).json({ success: false, message: 'Publication date cannot be in the past' });
      }
    }

    const updateFields = {};
    if (req.body.title) updateFields.title = sanitizeString(req.body.title);
    if (req.body.content) updateFields.content = sanitizeString(req.body.content);
    if (typeof req.body.isUrgent === 'boolean') updateFields.isUrgent = req.body.isUrgent;
    if (req.body.publishedBy) updateFields.publishedBy = req.body.publishedBy;
    if (req.body.publishDate !== undefined) updateFields.publishDate = req.body.publishDate || null;
    if (req.body.status) updateFields.status = req.body.status;

    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, mosqueId: req.user.mosqueId },
      updateFields,
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
