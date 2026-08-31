const Event = require('../models/Event');
const Mosque = require('../models/Mosque');
const { resolveScope } = require('./scopeService');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function coerceBool(v, fallback = true) {
  if (v === undefined) return fallback;
  if (v === false || v === 'false') return false;
  return true;
}

function coerceImagePath(req) {
  return req.file ? '/uploads/events/' + req.file.filename : undefined;
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

async function listPublic({ mosqueId, limit, page }) {
  if (mosqueId && !isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
  const query = { isActive: true, ...(mosqueId ? { mosqueId } : {}) };
  const safeLimit = clampLimit(limit);
  const safePage = clampPage(page);
  const [items, total] = await Promise.all([
    Event.find(query)
      .select('title date time location image category description maxParticipants requiresRegistration mosqueId registeredUsers')
      .sort({ date: 1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Event.countDocuments(query),
  ]);
  const data = items.map((e) => ({
    ...e,
    registeredCount: Array.isArray(e.registeredUsers) ? e.registeredUsers.length : 0,
  }));
  return { data, total, page: safePage, totalPages: Math.ceil(total / safeLimit) || 1 };
}

async function listForCaller(req) {
  const scope = await resolveScope(req, { allowManagerPick: true });
  const safeLimit = clampLimit(req.query.limit, 20);
  const safePage = clampPage(req.query.page);
  const [items, total] = await Promise.all([
    Event.find({ mosqueId: scope })
      .sort({ date: 1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Event.countDocuments({ mosqueId: scope }),
  ]);
  return { data: items, total, page: safePage, totalPages: Math.ceil(total / safeLimit) || 1 };
}

async function getRegistrations(id, req) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid event id');
  const scope = await resolveScope(req);
  const event = await Event.findOne({ _id: id, mosqueId: scope })
    .populate('registeredUsers', 'name email phone')
    .select('title registeredUsers')
    .lean();
  if (!event) throw httpError(404, 'Event not found');
  return {
    eventId: event._id,
    title: event.title,
    registrations: event.registeredUsers || [],
    registeredCount: (event.registeredUsers || []).length,
  };
}

async function getById(id) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid event id');
  const event = await Event.findById(id);
  if (!event) throw httpError(404, 'Event not found');
  return event;
}

async function create(input, user, imagePath) {
  const { title, date, time, location, maxParticipants, description, requiresRegistration, mosqueId: bodyMosqueId } = input;

  if (!title || String(title).trim().length < 3) throw httpError(400, 'Title is required (min 3 chars)');
  if (!date) throw httpError(400, 'Valid date is required');
  const eventDate = new Date(date);
  if (isNaN(eventDate.getTime())) throw httpError(400, 'Invalid date format');
  if (eventDate < todayMidnight()) throw httpError(400, 'Event date cannot be in past');

  let targetMosqueId;
  if (user.role === 'manager') {
    targetMosqueId = bodyMosqueId;
    if (!targetMosqueId) throw httpError(400, 'Manager must specify a mosqueId in the request body');
    if (!isValidObjectId(targetMosqueId)) throw httpError(400, 'Invalid mosqueId');
    const owns = await Mosque.exists({ _id: targetMosqueId, managerId: user._id });
    if (!owns) throw httpError(403, 'You can only create events for mosques you manage');
  } else {
    if (bodyMosqueId && bodyMosqueId !== String(user.mosqueId)) {
      throw httpError(403, 'Cannot create events for a different mosque');
    }
    if (!user.mosqueId) throw httpError(400, 'Your account is not assigned to a mosque. Contact your manager.');
    targetMosqueId = user.mosqueId;
  }

  const data = {
    title: sanitizeString(title),
    description: sanitizeString(description || ''),
    date: eventDate,
    time: sanitizeString(time || ''),
    location: sanitizeString(location || ''),
    maxParticipants: Number(maxParticipants) || 0,
    requiresRegistration: coerceBool(requiresRegistration),
    mosqueId: targetMosqueId,
  };
  if (imagePath) data.image = imagePath;
  return Event.create(data);
}

async function update(id, body, req) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid event id');

  if (body.date) {
    const eventDate = new Date(body.date);
    if (eventDate < todayMidnight()) throw httpError(400, 'Event date cannot be in past');
  }

  const scope = await resolveScope(req, { allowManagerPick: true });

  const updateData = { ...body };
  if (body.title) updateData.title = sanitizeString(body.title);
  if (body.description != null) updateData.description = sanitizeString(body.description);
  if (body.location) updateData.location = sanitizeString(body.location);
  if (body.requiresRegistration !== undefined) {
    updateData.requiresRegistration = coerceBool(body.requiresRegistration);
  }
  if (body.maxParticipants !== undefined) {
    updateData.maxParticipants = Number(body.maxParticipants) || 0;
  }
  if (req.file) updateData.image = '/uploads/events/' + req.file.filename;
  delete updateData.mosqueId;

  const event = await Event.findOneAndUpdate(
    { _id: id, mosqueId: scope },
    updateData,
    { new: true, runValidators: true }
  );
  if (!event) throw httpError(404, 'Event not found');
  return event;
}

async function remove(id, req) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid event id');
  const scope = await resolveScope(req, { allowManagerPick: true });
  const event = await Event.findOneAndDelete({ _id: id, mosqueId: scope });
  if (!event) throw httpError(404, 'Event not found');
  return event;
}

async function registerAttendee(id, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid event id');

  const event = await Event.findById(id);
  if (!event) throw httpError(404, 'Event not found');
  if (event.requiresRegistration === false) {
    throw httpError(400, 'Registration is not required for this event');
  }
  if (event.maxParticipants > 0 && event.registeredUsers.length >= event.maxParticipants) {
    throw httpError(400, 'Event is full');
  }
  if (event.registeredUsers.some((u) => String(u) === String(user._id))) {
    throw httpError(400, 'Already registered');
  }
  event.registeredUsers.push(user._id);
  await event.save();
  return event;
}

module.exports = {
  listPublic,
  listForCaller,
  getById,
  getRegistrations,
  create,
  update,
  remove,
  registerAttendee,
};
