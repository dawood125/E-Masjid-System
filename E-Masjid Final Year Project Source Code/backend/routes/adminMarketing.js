const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Testimonial = require('../models/Testimonial');
const HeroSlide = require('../models/HeroSlide');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation, sanitizeString, isValidObjectId } = require('../middleware/validate');
const { body } = require('express-validator');

/**
 * Admin Marketing routes (Phase 4.5).
 *
 * All routes here are protected (auth required) and restricted to
 * role='admin' (or 'manager' — TBD). They let an admin:
 *   - List, create, update, delete campaigns (with the auto-unfeature logic)
 *   - List, create, update, delete testimonials
 *   - List, create, update, delete hero slides
 *
 * Note: per the current auth setup, route protection uses role 'admin'
 * (not 'manager' or 'committee'). Adjust if your FYP needs broader access.
 */

const validateCampaign = [
  body('title').isString().trim().isLength({ min: 3, max: 140 }).withMessage('Title must be 3-140 chars'),
  body('subtitle').optional().isString().trim().isLength({ max: 400 }),
  body('targetAmount').isFloat({ min: 0 }).withMessage('Target amount must be positive'),
  body('raisedAmount').optional().isFloat({ min: 0 }),
  body('donorCount').optional().isInt({ min: 0 }),
  body('daysLeft').optional().isInt({ min: 0 }),
  body('image').optional().isString().trim(),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
  body('order').optional().isInt({ min: 0 }),
  handleValidation,
];

const validateTestimonial = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 chars'),
  body('role').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Role is required'),
  body('quote').isString().trim().isLength({ min: 10, max: 600 }).withMessage('Quote must be 10-600 chars'),
  body('photo').optional().isString().trim(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  handleValidation,
];

const validateHeroSlide = [
  body('image').isString().trim().notEmpty().withMessage('Image URL/path is required'),
  body('mobileImage').optional().isString().trim(),
  body('caption').optional().isString().trim().isLength({ max: 140 }),
  body('link').optional().isString().trim(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  handleValidation,
];

// ─── CAMPAIGNS ───────────────────────────────────────

// GET /api/admin/marketing/campaigns — list all (active + inactive)
router.get('/campaigns', protect, authorize('admin'), async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean({ virtuals: true });
    res.json({ success: true, data: campaigns });
  } catch (err) { next(err); }
});

// POST /api/admin/marketing/campaigns — create
router.post('/campaigns', protect, authorize('admin'), validateCampaign, async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (data.title) data.title = sanitizeString(data.title);
    if (data.subtitle) data.subtitle = sanitizeString(data.subtitle);
    if (data.image) data.image = sanitizeString(data.image);
    const campaign = await Campaign.create(data);
    res.status(201).json({ success: true, data: campaign.toJSON({ virtuals: true }) });
  } catch (err) { next(err); }
});

// PUT /api/admin/marketing/campaigns/:id — update
router.put('/campaigns/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign id' });
    }
    const updates = { ...req.body };
    if (updates.title) updates.title = sanitizeString(updates.title);
    if (updates.subtitle) updates.subtitle = sanitizeString(updates.subtitle);
    if (updates.image) updates.image = sanitizeString(updates.image);
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign.toJSON({ virtuals: true }) });
  } catch (err) { next(err); }
});

// DELETE /api/admin/marketing/campaigns/:id — delete
router.delete('/campaigns/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign id' });
    }
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) { next(err); }
});

// ─── TESTIMONIALS ───────────────────────────────────────

router.get('/testimonials', protect, authorize('admin'), async (req, res, next) => {
  try {
    const items = await Testimonial.find({}).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

router.post('/testimonials', protect, authorize('admin'), validateTestimonial, async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (data.name) data.name = sanitizeString(data.name);
    if (data.role) data.role = sanitizeString(data.role);
    if (data.quote) data.quote = sanitizeString(data.quote);
    if (data.photo) data.photo = sanitizeString(data.photo);
    const testimonial = await Testimonial.create(data);
    res.status(201).json({ success: true, data: testimonial });
  } catch (err) { next(err); }
});

router.put('/testimonials/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid testimonial id' });
    }
    const updates = { ...req.body };
    if (updates.name) updates.name = sanitizeString(updates.name);
    if (updates.role) updates.role = sanitizeString(updates.role);
    if (updates.quote) updates.quote = sanitizeString(updates.quote);
    if (updates.photo) updates.photo = sanitizeString(updates.photo);
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    res.json({ success: true, data: testimonial });
  } catch (err) { next(err); }
});

router.delete('/testimonials/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid testimonial id' });
    }
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (err) { next(err); }
});

// ─── HERO SLIDES ───────────────────────────────────────

router.get('/hero-slides', protect, authorize('admin'), async (req, res, next) => {
  try {
    const slides = await HeroSlide.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: slides });
  } catch (err) { next(err); }
});

router.post('/hero-slides', protect, authorize('admin'), validateHeroSlide, async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (data.image) data.image = sanitizeString(data.image);
    if (data.mobileImage) data.mobileImage = sanitizeString(data.mobileImage);
    if (data.caption) data.caption = sanitizeString(data.caption);
    if (data.link) data.link = sanitizeString(data.link);
    const slide = await HeroSlide.create(data);
    res.status(201).json({ success: true, data: slide });
  } catch (err) { next(err); }
});

router.put('/hero-slides/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid hero slide id' });
    }
    const updates = { ...req.body };
    if (updates.image) updates.image = sanitizeString(updates.image);
    if (updates.mobileImage) updates.mobileImage = sanitizeString(updates.mobileImage);
    if (updates.caption) updates.caption = sanitizeString(updates.caption);
    if (updates.link) updates.link = sanitizeString(updates.link);
    const slide = await HeroSlide.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Hero slide not found' });
    }
    res.json({ success: true, data: slide });
  } catch (err) { next(err); }
});

router.delete('/hero-slides/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid hero slide id' });
    }
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Hero slide not found' });
    }
    res.json({ success: true, message: 'Hero slide deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
