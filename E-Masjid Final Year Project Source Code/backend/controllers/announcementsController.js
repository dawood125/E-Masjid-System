const Announcement = require('../models/Announcement');
const Mosque = require('../models/Mosque');
const { resolveScope } = require('../services/scopeService');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');
const { tryOrNext } = require('../utils/asyncRoute');

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function clampLimit(raw, fallback = 20, max = 100) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function clampPage(raw, fallback = 1) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

const listPublic = tryOrNext(async (req, res) => {
  const mosqueId = req.query.mosqueId;
  const includeAll = req.query.includeAll;
  const limit = req.query.limit;
  const page = req.query.page;
  if (mosqueId && !isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
  const query = mosqueId ? { mosqueId } : {};
  if (includeAll !== 'true') {
    query.status = { $ne: 'draft' };
    query.$or = [
      { publishDate: { $lte: new Date() } },
      { publishDate: { $exists: false } },
      { publishDate: null },
    ];
  }
  const safeLimit = clampLimit(limit);
  const safePage = clampPage(page);
  const [items, total] = await Promise.all([
    Announcement.find(query)
      .select('title content isUrgent publishDate status createdAt mosqueId publishedBy')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Announcement.countDocuments(query),
  ]);
  res.json({
    success: true,
    data: items,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
  });
});

const listForCaller = tryOrNext(async (req, res) => {
  const scope = await resolveScope(req, { allowManagerPick: true });
  const safeLimit = clampLimit(req.query.limit, 20);
  const safePage = clampPage(req.query.page);
  const [items, total] = await Promise.all([
    Announcement.find({ mosqueId: scope })
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Announcement.countDocuments({ mosqueId: scope }),
  ]);
  res.json({
    success: true,
    data: items,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
  });
});

const create = tryOrNext(async (req, res) => {
  const input = req.body;
  const user = req.user;
  if (input.publishDate) {
    const pubDate = new Date(input.publishDate);
    if (pubDate < todayMidnight()) throw httpError(400, 'Publication date cannot be in the past');
  }

  let targetMosqueId;
  if (user.role === 'manager') {
    targetMosqueId = input.mosqueId;
    if (!targetMosqueId) throw httpError(400, 'Manager must specify a mosqueId in the request body');
    const owns = await Mosque.exists({ _id: targetMosqueId, managerId: user._id });
    if (!owns) throw httpError(403, 'You can only create announcements for mosques you manage');
  } else {
    if (input.mosqueId && input.mosqueId !== String(user.mosqueId)) {
      throw httpError(403, 'Cannot create announcements for a different mosque');
    }
    if (!user.mosqueId) throw httpError(400, 'Your account is not assigned to a mosque. Contact your manager.');
    targetMosqueId = user.mosqueId;
  }

  const item = await Announcement.create({
    title: sanitizeString(input.title),
    content: sanitizeString(input.content),
    isUrgent: input.isUrgent || false,
    publishedBy: input.publishedBy,
    publishDate: input.publishDate || undefined,
    status: input.status || 'published',
    mosqueId: targetMosqueId,
  });
  res.status(201).json({ success: true, data: item });
});

const update = tryOrNext(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw httpError(400, 'Invalid announcement id');

  const updateFields = {};
  const body = req.body;
  if (body.title) updateFields.title = sanitizeString(body.title);
  if (body.content) updateFields.content = sanitizeString(body.content);
  if (typeof body.isUrgent === 'boolean') updateFields.isUrgent = body.isUrgent;
  if (body.publishedBy) updateFields.publishedBy = body.publishedBy;
  if (body.publishDate !== undefined) updateFields.publishDate = body.publishDate || null;
  if (body.status) updateFields.status = body.status;

  const scope = await resolveScope(req, { allowManagerPick: true });
  const updated = await Announcement.findOneAndUpdate(
    { _id: req.params.id, mosqueId: scope },
    updateFields,
    { new: true, runValidators: true }
  );
  if (!updated) throw httpError(404, 'Not found');
  res.json({ success: true, data: updated });
});

const remove = tryOrNext(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw httpError(400, 'Invalid announcement id');
  const scope = await resolveScope(req, { allowManagerPick: true });
  const removed = await Announcement.findOneAndDelete({ _id: req.params.id, mosqueId: scope });
  if (!removed) throw httpError(404, 'Not found');
  res.json({ success: true, message: 'Deleted' });
});

module.exports = { listPublic, listForCaller, create, update, remove };
