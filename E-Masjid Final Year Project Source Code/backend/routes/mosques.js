const express = require('express');
const router = express.Router();
const Mosque = require('../models/Mosque');
const { protect, authorize } = require('../middleware/auth');

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
    const mosque = await Mosque.findById(req.params.id);
    if (!mosque) return res.status(404).json({ success: false, message: 'Mosque not found' });
    res.json({ success: true, data: mosque });
  } catch (error) { next(error); }
});

// POST /api/mosques - Create mosque
router.post('/', protect, authorize('manager'), async (req, res, next) => {
  try {
    const mosque = await Mosque.create({ ...req.body, managerId: req.user._id });
    res.status(201).json({ success: true, data: mosque });
  } catch (error) { next(error); }
});

// PUT /api/mosques/:id - Update mosque
router.put('/:id', protect, authorize('manager'), async (req, res, next) => {
  try {
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
    const { enabledModules } = req.body;
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
