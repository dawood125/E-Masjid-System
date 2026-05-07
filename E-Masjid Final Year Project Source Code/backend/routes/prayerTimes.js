const express = require('express');
const router = express.Router();
const PrayerTime = require('../models/PrayerTime');
const { protect, authorize } = require('../middleware/auth');

// GET /api/prayer-times - Public
router.get('/', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPrayer = await PrayerTime.findOne({
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
    });

    const endOfWeek = new Date(today.getTime() + 7 * 86400000);
    const weekPrayers = await PrayerTime.find({
      date: { $gte: today, $lt: endOfWeek },
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        today: todayPrayer || { fajr: '05:30', zuhr: '12:45', asr: '15:45', maghrib: '18:25', isha: '19:45', jummah: '13:00' },
        week: weekPrayers,
      },
    });
  } catch (error) { next(error); }
});

// PUT /api/prayer-times - Update prayer times (admin)
router.put('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { date, fajr, zuhr, asr, maghrib, isha, jummah } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const prayerTime = await PrayerTime.findOneAndUpdate(
      { date: targetDate, mosqueId: req.user.mosqueId },
      { date: targetDate, fajr, zuhr, asr, maghrib, isha, jummah, mosqueId: req.user.mosqueId },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: prayerTime });
  } catch (error) { next(error); }
});

module.exports = router;
