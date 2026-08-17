const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Mosque = require('../models/Mosque');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');
const upload = require('../middleware/upload');
const { resolveScope } = require('../utils/scope');

router.get('/', async (req, res, next) => {
  try {
    const { mosqueId } = req.query;
    if (mosqueId && !isValidObjectId(mosqueId)) {
      return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
    }
    const query = { isActive: true, ...(mosqueId ? { mosqueId } : {}) };
    const events = await Event.find(query).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (error) { next(error); }
});

router.get('/admin', protect, authorize('admin', 'manager', 'scholar', 'committee'), async (req, res, next) => {
  try {
    const scope = await resolveScope(req, { allowManagerPick: true });
    if (scope.error) return res.status(400).json({ success: false, message: scope.error });
    const events = await Event.find({ mosqueId: scope.scope }).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
});

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  upload.single('image'),
  async (req, res, next) => {
  try {
    const { title, date, time, location, maxParticipants, description, requiresRegistration, mosqueId: bodyMosqueId } = req.body;
    if (!title || String(title).trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Title is required (min 3 chars)' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Valid date is required' });
    }
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (eventDate < todayMidnight()) {
      return res.status(400).json({ success: false, message: 'Event date cannot be in past' });
    }

    let targetMosqueId;
    if (req.user.role === 'manager') {
      targetMosqueId = bodyMosqueId;
      if (!targetMosqueId) {
        return res.status(400).json({ success: false, message: 'Manager must specify a mosqueId in the request body' });
      }
      if (!isValidObjectId(targetMosqueId)) {
        return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
      }
      const ownsMosque = await Mosque.exists({ _id: targetMosqueId, managerId: req.user._id });
      if (!ownsMosque) {
        return res.status(403).json({ success: false, message: 'You can only create events for mosques you manage' });
      }
    } else {
      if (bodyMosqueId && bodyMosqueId !== String(req.user.mosqueId)) {
        return res.status(403).json({ success: false, message: 'Cannot create events for a different mosque' });
      }
      if (!req.user.mosqueId) {
        return res.status(400).json({ success: false, message: 'Your account is not assigned to a mosque. Contact your manager.' });
      }
      targetMosqueId = req.user.mosqueId;
    }

    const eventData = {
      title: sanitizeString(title),
      description: sanitizeString(description || ''),
      date: eventDate,
      time: sanitizeString(time || ''),
      location: sanitizeString(location || ''),
      maxParticipants: Number(maxParticipants) || 0,
      requiresRegistration: requiresRegistration === 'false' ? false : (requiresRegistration === false ? false : true),
      mosqueId: targetMosqueId,
    };
    if (req.file) eventData.image = '/uploads/events/' + req.file.filename;
    const event = await Event.create(eventData);
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
});

router.put('/:id', protect, authorize('admin', 'manager'), upload.single('image'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    if (req.body.date) {
      const eventDate = new Date(req.body.date);
      if (eventDate < todayMidnight()) {
        return res.status(400).json({ success: false, message: 'Event date cannot be in past' });
      }
    }

    const scope = await resolveScope(req, { allowManagerPick: true });
    if (scope.error) return res.status(400).json({ success: false, message: scope.error });

    const updateData = {
      ...req.body,
      ...(req.body.title ? { title: sanitizeString(req.body.title) } : {}),
      ...(req.body.description != null ? { description: sanitizeString(req.body.description) } : {}),
      ...(req.body.location ? { location: sanitizeString(req.body.location) } : {}),
    };
    if (req.body.requiresRegistration !== undefined) {
      updateData.requiresRegistration = req.body.requiresRegistration === 'false' ? false : (req.body.requiresRegistration === false ? false : true);
    }
    if (req.body.maxParticipants !== undefined) {
      updateData.maxParticipants = Number(req.body.maxParticipants) || 0;
    }
    if (req.file) updateData.image = '/uploads/events/' + req.file.filename;
    delete updateData.mosqueId;

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, mosqueId: scope.scope },
      updateData,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
});

router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    const scope = await resolveScope(req, { allowManagerPick: true });
    if (scope.error) return res.status(400).json({ success: false, message: scope.error });
    const event = await Event.findOneAndDelete({ _id: req.params.id, mosqueId: scope.scope });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) { next(error); }
});

router.post('/:id/register', protect, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.requiresRegistration === false) {
      return res.status(400).json({ success: false, message: 'Registration is not required for this event' });
    }
    if (event.maxParticipants > 0 && event.registeredUsers.length >= event.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }
    if (event.registeredUsers.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Already registered' });
    }
    event.registeredUsers.push(req.user._id);
    await event.save();
    res.json({ success: true, message: 'Registered successfully', data: event });
  } catch (error) { next(error); }
});

module.exports = router;