const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Mosque = require('../models/Mosque');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

// Helper: figure out which mosqueId the caller is allowed to scope by.
// - manager: the platform-operator role. They can manage announcements for any
//   mosque they oversee (matched by Mosque.managerId === req.user._id), or
//   omit ?mosqueId= to get all the mosques they manage. (Managers do NOT have
//   a user.mosqueId — they're scoped per-mosque via the Mosque document.)
// - admin / scholar / committee: forced to req.user.mosqueId
// - any of those whose user.mosqueId is undefined (data-integrity bug): reject
//   with 400 instead of silently returning everything.
async function resolveScopedMosqueId(req, { allowManagerPick = false } = {}) {
  if (req.user.role === 'manager') {
    // Find all mosques this manager oversees.
    const managedMosques = await Mosque.find({ managerId: req.user._id }).select('_id');
    const managedIds = managedMosques.map((m) => String(m._id));
    if (managedIds.length === 0) {
      return { error: 'You do not manage any mosques.' };
    }
    if (allowManagerPick && req.query.mosqueId && isValidObjectId(req.query.mosqueId)) {
      if (!managedIds.includes(req.query.mosqueId)) {
        return { error: 'You can only manage announcements for mosques you oversee.' };
      }
      return { scope: req.query.mosqueId, isManagerPick: true };
    }
    return { scope: { $in: managedIds }, isManagerPick: false };
  }
  if (!req.user.mosqueId) {
    return { error: 'Your account is not assigned to a mosque. Contact your manager.' };
  }
  return { scope: req.user.mosqueId, isManagerPick: false };
}

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
    const resolved = await resolveScopedMosqueId(req, { allowManagerPick: true });
    if (resolved.error) {
      return res.status(400).json({ success: false, message: resolved.error });
    }

    const query = {};
    if (resolved.scope) {
      query.mosqueId = resolved.scope;
    }
    // includeAll=true on the admin endpoint returns drafts too (for the
    // status filter pills). includeAll is the only flag we accept.
    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: announcements });
  } catch (error) { next(error); }
});

// POST /api/announcements - Admin
// Phase 6 (BUG-ANN-012): require the caller to have a mosqueId assigned. If
// they sent a body.mosqueId that doesn't match req.user.mosqueId, return
// 403 — clear signal of attempted cross-mosque write, even though the
// backend would have already overridden to req.user.mosqueId. Manager can
// create for any of the mosques they oversee by passing body.mosqueId.
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

    // Resolve which mosqueId this announcement belongs to.
    let targetMosqueId;
    if (req.user.role === 'manager') {
      // Manager: must specify a mosqueId they oversee. We never let them post
      // for a mosque they don't manage.
      targetMosqueId = req.body.mosqueId;
      if (!targetMosqueId) {
        return res.status(400).json({ success: false, message: 'Manager must specify a mosqueId in the request body' });
      }
      const ownsMosque = await Mosque.exists({ _id: targetMosqueId, managerId: req.user._id });
      if (!ownsMosque) {
        return res.status(403).json({ success: false, message: 'You can only create announcements for mosques you manage' });
      }
    } else {
      // Regular admin: forced to req.user.mosqueId. If they pass a different
      // one in the body, that's a cross-mosque write attempt → 403.
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
// FIX-ANN-007 (BUG-ANN-006): removed the past-date block on edit. The admin must
// be able to correct drafts even if their scheduled publishDate is now in the past
// (Phase 5 Q11 parity). The create-side past-date check is preserved.
// Phase 6 (BUG-ANN-012): the findOneAndUpdate query is scoped to the caller's
// own mosqueId so a regular admin cannot edit another mosque's row.
// Manager can edit any row for the mosques they oversee by passing
// ?mosqueId=<id> or omitting it (the scope is then $in their managed ids).
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
    if (req.user.role === 'manager') {
      const managedMosques = await Mosque.find({ managerId: req.user._id }).select('_id');
      const managedIds = managedMosques.map((m) => String(m._id));
      if (managedIds.length === 0) {
        return res.status(400).json({ success: false, message: 'You do not manage any mosques.' });
      }
      if (req.query.mosqueId && isValidObjectId(req.query.mosqueId)) {
        if (!managedIds.includes(req.query.mosqueId)) {
          return res.status(403).json({ success: false, message: 'You can only edit announcements for mosques you manage' });
        }
        filter.mosqueId = req.query.mosqueId;
      } else {
        filter.mosqueId = { $in: managedIds };
      }
    } else {
      // Regular admin: forced to their own mosqueId. Without one, refuse.
      if (!req.user.mosqueId) {
        return res.status(400).json({ success: false, message: 'Your account is not assigned to a mosque. Contact your manager.' });
      }
      filter.mosqueId = req.user.mosqueId;
    }

    const announcement = await Announcement.findOneAndUpdate(
      filter,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: announcement });
  } catch (error) { next(error); }
});

// DELETE /api/announcements/:id
// Phase 6 (BUG-ANN-012): same scoping rules as PUT — regular admins can only
// delete their own mosque's announcements; Manager can delete any for the
// mosques they oversee.
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid announcement id' });
    }
    const filter = { _id: req.params.id };
    if (req.user.role === 'manager') {
      const managedMosques = await Mosque.find({ managerId: req.user._id }).select('_id');
      const managedIds = managedMosques.map((m) => String(m._id));
      if (managedIds.length === 0) {
        return res.status(400).json({ success: false, message: 'You do not manage any mosques.' });
      }
      if (req.query.mosqueId && isValidObjectId(req.query.mosqueId)) {
        if (!managedIds.includes(req.query.mosqueId)) {
          return res.status(403).json({ success: false, message: 'You can only delete announcements for mosques you manage' });
        }
        filter.mosqueId = req.query.mosqueId;
      } else {
        filter.mosqueId = { $in: managedIds };
      }
    } else {
      if (!req.user.mosqueId) {
        return res.status(400).json({ success: false, message: 'Your account is not assigned to a mosque. Contact your manager.' });
      }
      filter.mosqueId = req.user.mosqueId;
    }
    const announcement = await Announcement.findOneAndDelete(filter);
    if (!announcement) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) { next(error); }
});

module.exports = router;