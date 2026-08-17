const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Mosque = require('../models/Mosque');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');
const { resolveScope } = require('../utils/scope');

// GET /api/announcements - Public
// Public visitors only see published-and-past-publishDate items, optionally
// scoped by mosqueId. No authentication is required or expected.
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

// GET /api/announcements/admin - Protected
// Phase 6 (BUG-ANN-012): the admin/management UI must NEVER fetch the public
// endpoint without a mosqueId, because an unscoped GET returns rows from
// every mosque. This protected endpoint force-scopes to req.user.mosqueId
// (or lets manager pick via ?mosqueId=) and refuses to leak data when the
// caller's account has no mosqueId assigned (data-integrity safeguard).
router.get('/admin', protect, authorize('admin', 'manager', 'scholar', 'committee'), async (req, res, next) => {
  try {
    const resolved = await resolveScope(req, { allowManagerPick: true });
    if (resolved.error) {
      return res.status(400).json({ success: false, message: resolved.error });
    }

    const query = {};
    if (resolved.scope) query.mosqueId = resolved.scope;
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) { next(error); }
});

router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  [
    body('title').isString().trim().isLength({ min: 3, max: 150 }).withMessage('Title is required'),
    body('content').isString().trim().isLength({ min: 5, max: 2000 }).withMessage('Content is required'),
    body('isUrgent').optional().isBoolean().withMessage('isUrgent must be boolean'),
    body('publishDate').optional().isISO8601().withMessage('Invalid publish date'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
    body('mosqueId').optional().isMongoId().withMessage('Invalid mosqueId'),
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

    let targetMosqueId;
    if (req.user.role === 'manager') {
      targetMosqueId = req.body.mosqueId;
      if (!targetMosqueId) {
        return res.status(400).json({ success: false, message: 'Manager must specify a mosqueId in the request body' });
      }
      const ownsMosque = await Mosque.exists({ _id: targetMosqueId, managerId: req.user._id });
      if (!ownsMosque) {
        return res.status(403).json({ success: false, message: 'You can only create announcements for mosques you manage' });
      }
    } else {
      if (req.body.mosqueId && req.body.mosqueId !== String(req.user.mosqueId)) {
        return res.status(403).json({ success: false, message: 'Cannot create announcements for a different mosque' });
      }
      if (!req.user.mosqueId) {
        return res.status(400).json({ success: false, message: 'Your account is not assigned to a mosque. Contact your manager.' });
      }
      targetMosqueId = req.user.mosqueId;
    }

    const announcement = await Announcement.create({
      title: sanitizeString(req.body.title),
      content: sanitizeString(req.body.content),
      isUrgent: req.body.isUrgent || false,
      publishedBy: req.body.publishedBy,
      publishDate: req.body.publishDate || undefined,
      status: req.body.status || 'published',
      mosqueId: targetMosqueId,
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (error) { next(error); }
});

// PUT /api/announcements/:id
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid announcement id' });
    }

    const updateFields = {};
    if (req.body.title) updateFields.title = sanitizeString(req.body.title);
    if (req.body.content) updateFields.content = sanitizeString(req.body.content);
    if (typeof req.body.isUrgent === 'boolean') updateFields.isUrgent = req.body.isUrgent;
    if (req.body.publishedBy) updateFields.publishedBy = req.body.publishedBy;
    if (req.body.publishDate !== undefined) updateFields.publishDate = req.body.publishDate || null;
    if (req.body.status) updateFields.status = req.body.status;

    const filter = { _id: req.params.id };
    const scope = await resolveScope(req, { allowManagerPick: true });
    if (scope.error) return res.status(400).json({ success: false, message: scope.error });
    filter.mosqueId = scope.scope;

    const announcement = await Announcement.findOneAndUpdate(
      filter,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: announcement });
  } catch (error) { next(error); }
});

router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid announcement id' });
    }
    const filter = { _id: req.params.id };
    const scope = await resolveScope(req, { allowManagerPick: true });
    if (scope.error) return res.status(400).json({ success: false, message: scope.error });
    filter.mosqueId = scope.scope;

    const announcement = await Announcement.findOneAndDelete(filter);
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
});

module.exports = router;