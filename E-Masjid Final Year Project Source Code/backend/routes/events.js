const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');
const upload = require('../middleware/upload');

// GET /api/events - List events (public)
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

// GET /api/events/:id
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

// POST /api/events - Create event (admin, with optional image)
router.post(
  '/',
  protect,
  authorize('admin'),
  upload.single('image'),
  async (req, res, next) => {
  try {
    const { title, date, time, location, maxParticipants, description, requiresRegistration } = req.body;
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
    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
    if (eventDate < todayMidnight) {
      return res.status(400).json({ success: false, message: 'Event date cannot be in past' });
    }
    const eventData = {
      title: sanitizeString(title),
      description: sanitizeString(description || ''),
      date: eventDate,
      time: sanitizeString(time || ''),
      location: sanitizeString(location || ''),
      maxParticipants: Number(maxParticipants) || 0,
      requiresRegistration: requiresRegistration === 'false' ? false : (requiresRegistration === false ? false : true),
      mosqueId: req.user.mosqueId,
    };
    if (req.file) {
      eventData.image = '/uploads/events/' + req.file.filename;
    }
    const event = await Event.create(eventData);
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
});

// PUT /api/events/:id
router.put('/:id', protect, authorize('admin'), upload.single('image'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    if (req.body.date) {
      const eventDate = new Date(req.body.date);
      const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
      if (eventDate < todayMidnight) {
        return res.status(400).json({ success: false, message: 'Event date cannot be in past' });
      }
    }
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
    if (req.file) {
      updateData.image = '/uploads/events/' + req.file.filename;
    }
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, mosqueId: req.user.mosqueId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
});

// DELETE /api/events/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    const event = await Event.findOneAndDelete({ _id: req.params.id, mosqueId: req.user.mosqueId });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) { next(error); }
});

// POST /api/events/:id/register - Register for event
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
