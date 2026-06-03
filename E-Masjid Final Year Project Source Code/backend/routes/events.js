const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

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

// POST /api/events - Create event (admin)
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('title').isString().trim().isLength({ min: 3, max: 150 }).withMessage('Title is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').optional().isString().trim().isLength({ min: 3, max: 20 }).withMessage('Invalid time'),
    body('location').optional().isString().trim().isLength({ min: 2, max: 150 }).withMessage('Invalid location'),
    body('maxParticipants').optional({ nullable: true }).isInt({ min: 0 }).withMessage('maxParticipants must be 0 or greater'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const eventDate = new Date(req.body.date);
    if (eventDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Event date cannot be in past' });
    }
    const event = await Event.create({
      ...req.body,
      title: sanitizeString(req.body.title),
      description: sanitizeString(req.body.description || ''),
      location: sanitizeString(req.body.location || ''),
      mosqueId: req.user.mosqueId,
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) { next(error); }
});

// PUT /api/events/:id
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    if (req.body.date) {
      const eventDate = new Date(req.body.date);
      if (eventDate < new Date()) {
        return res.status(400).json({ success: false, message: 'Event date cannot be in past' });
      }
    }
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, mosqueId: req.user.mosqueId },
      {
        ...req.body,
        ...(req.body.title ? { title: sanitizeString(req.body.title) } : {}),
        ...(req.body.description ? { description: sanitizeString(req.body.description) } : {}),
        ...(req.body.location ? { location: sanitizeString(req.body.location) } : {}),
      },
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
