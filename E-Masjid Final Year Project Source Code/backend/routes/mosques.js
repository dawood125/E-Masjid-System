const express = require('express');
const router = express.Router();
const Mosque = require('../models/Mosque');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

// GET /api/mosques/public - List active mosques (public)
router.get('/public', async (req, res, next) => {
  try {
    const mosques = await Mosque.find({ isActive: true })
      .select('name city address phone email image enabledModules')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: mosques });
  } catch (error) { next(error); }
});

// GET /api/mosques - List mosques (manager)
router.get('/', protect, authorize('manager'), async (req, res, next) => {
  try {
    const mosques = await Mosque.find({ managerId: req.user._id });
    res.json({ success: true, data: mosques });
  } catch (error) { next(error); }
});

// GET /api/mosques/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid mosque id' });
    }
    const baseQuery = { _id: req.params.id };
    if (req.user.role === 'manager') baseQuery.managerId = req.user._id;
    if (req.user.role !== 'manager' && req.user.mosqueId) baseQuery._id = req.user.mosqueId;
    const mosque = await Mosque.findOne(baseQuery);
    if (!mosque) return res.status(404).json({ success: false, message: 'Mosque not found' });
    res.json({ success: true, data: mosque });
  } catch (error) { next(error); }
});

// POST /api/mosques - Create mosque
router.post(
  '/',
  protect,
  authorize('manager'),
  [
    body('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name is required'),
    body('city').isString().trim().isLength({ min: 2, max: 80 }).withMessage('City is required'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const mosque = await Mosque.create({
      ...req.body,
      name: sanitizeString(req.body.name),
      city: sanitizeString(req.body.city),
      managerId: req.user._id,
    });
    res.status(201).json({ success: true, data: mosque });
  } catch (error) { next(error); }
});

// PUT /api/mosques/:id - Update mosque
router.put('/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid mosque id' });
    }
    const mosque = await Mosque.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!mosque) return res.status(404).json({ success: false, message: 'Mosque not found' });
    res.json({ success: true, data: mosque });
  } catch (error) { next(error); }
});

// PUT /api/mosques/:id/modules - Toggle modules
router.put('/:id/modules', protect, authorize('manager'), async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid mosque id' });
    }
    const { enabledModules } = req.body;
    const allowedModules = ['donations', 'expenses', 'events', 'nikah', 'announcements', 'prayerTimes', 'fundRequests'];
    if (!Array.isArray(enabledModules) || enabledModules.some((m) => !allowedModules.includes(m))) {
      return res.status(400).json({ success: false, message: 'Invalid enabled modules list' });
    }
    const mosque = await Mosque.findOneAndUpdate(
      { _id: req.params.id, managerId: req.user._id },
      { enabledModules },
      { new: true }
    );
    if (!mosque) return res.status(404).json({ success: false, message: 'Mosque not found' });
    res.json({ success: true, data: mosque });
  } catch (error) { next(error); }
});

module.exports = router;
