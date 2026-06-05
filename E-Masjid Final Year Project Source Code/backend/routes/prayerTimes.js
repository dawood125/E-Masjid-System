const express = require('express');
const router = express.Router();
const PrayerTime = require('../models/PrayerTime');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId } = require('../middleware/validate');

// GET /api/prayer-times - Public
router.get('/', async (req, res, next) => {
  try {
    const { mosqueId } = req.query;
    if (mosqueId && !isValidObjectId(mosqueId)) {
      return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPrayer = await PrayerTime.findOne({
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
      ...(mosqueId ? { mosqueId } : {}),
    });

    const endOfWeek = new Date(today.getTime() + 7 * 86400000);
    const weekPrayers = await PrayerTime.find({
      date: { $gte: today, $lt: endOfWeek },
      ...(mosqueId ? { mosqueId } : {}),
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        today: todayPrayer || { fajr: '05:30', zuhr: '12:45', asr: '15:45', maghrib: '18:25', isha: '19:45', jummah: '13:00', eidUlFitr: '', eidUlAdha: '' },
        week: weekPrayers,
      },
    });
  } catch (error) { next(error); }
});

// PUT /api/prayer-times - Update prayer times (admin)
router.put(
  '/',
  protect,
  authorize('admin'),
  [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('fajr').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid fajr time is required'),
    body('zuhr').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid zuhr time is required'),
    body('asr').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid asr time is required'),
    body('maghrib').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid maghrib time is required'),
    body('isha').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid isha time is required'),
    body('jummah').optional().isString().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid jummah time'),
    body('eidUlFitr').optional().isString().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid Eid ul-Fitr time'),
    body('eidUlAdha').optional().isString().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid Eid ul-Adha time'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const { date, fajr, zuhr, asr, maghrib, isha, jummah, eidUlFitr, eidUlAdha } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const prayerTime = await PrayerTime.findOneAndUpdate(
      { date: targetDate, mosqueId: req.user.mosqueId },
      { date: targetDate, fajr, zuhr, asr, maghrib, isha, jummah, eidUlFitr, eidUlAdha, mosqueId: req.user.mosqueId },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: prayerTime });
  } catch (error) { next(error); }
});

module.exports = router;
