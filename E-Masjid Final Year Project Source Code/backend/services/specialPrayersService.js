const SpecialPrayer = require('../models/SpecialPrayer');
const Mosque = require('../models/Mosque');
const { resolveScope } = require('./scopeService');
const { isValidObjectId, sanitizeString } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function parseLocalDate(str) {
  if (!str) return null;
  const dt = new Date(str);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function clampLimit(raw, fallback = 20, max = 100) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

async function listPublic({ mosqueId, upcoming, includeInactive, limit }) {
  if (mosqueId && !isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
  if (!mosqueId) throw httpError(400, 'mosqueId is required');

  const query = { mosqueId };
  if (includeInactive !== 'true') query.isActive = true;
  if (upcoming === 'true') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.date = { $gte: today };
  }

  const safeLimit = clampLimit(limit);
  const items = await SpecialPrayer.find(query)
    .sort({ date: 1, time: 1 })
    .limit(safeLimit)
    .lean();

  return items;
}

async function listForCaller(req) {
  const scope = await resolveScope(req, { allowManagerPick: true });
  const includeInactive = req.query.includeInactive === 'true';

  const query = { mosqueId: scope };
  if (!includeInactive) query.isActive = true;

  const items = await SpecialPrayer.find(query)
    .sort({ date: 1 })
    .lean();

  return items;
}

async function listUpcomingForMosque(mosqueId, limit = 10) {
  if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return SpecialPrayer.find({ mosqueId, isActive: true, date: { $gte: today } })
    .sort({ date: 1 })
    .limit(limit)
    .lean();
}

async function create(input, user) {
  const date = parseLocalDate(input.date);
  if (!date) throw httpError(400, 'Invalid date');

  let targetMosqueId;
  if (user.role === 'manager') {
    targetMosqueId = input.mosqueId;
    if (!targetMosqueId) throw httpError(400, 'Manager must specify a mosqueId in the request body');
    const owns = await Mosque.exists({ _id: targetMosqueId, managerId: user._id });
    if (!owns) throw httpError(403, 'You can only create special prayers for mosques you manage');
  } else {
    if (input.mosqueId && input.mosqueId !== String(user.mosqueId)) {
      throw httpError(403, 'Cannot create special prayers for a different mosque');
    }
    if (!user.mosqueId) throw httpError(400, 'Your account is not assigned to a mosque. Contact your manager.');
    targetMosqueId = user.mosqueId;
  }

  const type = input.type || 'other';
  const allowedTypes = ['eid-fitr', 'eid-adha', 'shab-meraj', 'shab-barat', 'tarawih', 'janazah', 'milad-un-nabi', 'other'];
  if (!allowedTypes.includes(type)) throw httpError(400, 'Invalid type');

  return SpecialPrayer.create({
    name: sanitizeString(input.name),
    type,
    date,
    time: sanitizeString(input.time),
    description: sanitizeString(input.description || ''),
    isActive: input.isActive !== false,
    mosqueId: targetMosqueId,
    createdBy: user._id,
  });
}

async function update(id, body, req) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid special prayer id');

  const updateFields = {};
  if (body.name) updateFields.name = sanitizeString(body.name);
  if (body.type) {
    const allowedTypes = ['eid-fitr', 'eid-adha', 'shab-meraj', 'shab-barat', 'tarawih', 'janazah', 'milad-un-nabi', 'other'];
    if (!allowedTypes.includes(body.type)) throw httpError(400, 'Invalid type');
    updateFields.type = body.type;
  }
  if (body.date) {
    const dt = parseLocalDate(body.date);
    if (!dt) throw httpError(400, 'Invalid date');
    updateFields.date = dt;
  }
  if (body.time) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time)) throw httpError(400, 'Invalid time format');
    updateFields.time = body.time;
  }
  if (body.description !== undefined) updateFields.description = sanitizeString(body.description || '');
  if (typeof body.isActive === 'boolean') updateFields.isActive = body.isActive;

  const scope = await resolveScope(req, { allowManagerPick: true });
  const updated = await SpecialPrayer.findOneAndUpdate(
    { _id: id, mosqueId: scope },
    updateFields,
    { new: true, runValidators: true }
  );
  if (!updated) throw httpError(404, 'Not found');
  return updated;
}

async function toggle(id, req) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid special prayer id');
  const scope = await resolveScope(req, { allowManagerPick: true });

  const existing = await SpecialPrayer.findOne({ _id: id, mosqueId: scope });
  if (!existing) throw httpError(404, 'Not found');

  existing.isActive = !existing.isActive;
  await existing.save();
  return existing;
}

async function remove(id, req) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid special prayer id');
  const scope = await resolveScope(req, { allowManagerPick: true });
  const removed = await SpecialPrayer.findOneAndDelete({ _id: id, mosqueId: scope });
  if (!removed) throw httpError(404, 'Not found');
  return removed;
}

module.exports = {
  listPublic,
  listForCaller,
  listUpcomingForMosque,
  create,
  update,
  toggle,
  remove,
};
