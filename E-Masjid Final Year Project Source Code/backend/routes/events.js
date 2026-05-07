const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

// GET /api/events - List events (public)
router.get('/', async (req, res, next) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (error) { next(error); }
});

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
});

// POST /api/events - Create event (admin)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, mosqueId: req.user.mosqueId });
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
});

// PUT /api/events/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) { next(error); }
});

// DELETE /api/events/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) { next(error); }
});

// POST /api/events/:id/register - Register for event
router.post('/:id/register', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
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
