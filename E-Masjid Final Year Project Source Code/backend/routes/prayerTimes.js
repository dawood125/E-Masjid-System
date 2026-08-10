const express = require('express');
const router = express.Router();
const PrayerTime = require('../models/PrayerTime');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId } = require('../middleware/validate');

// FIX-PRAYER-001 + BUG-PRAYER-011: parse a YYYY-MM-DD string into a Date
// that represents local-midnight in the server's timezone (typically PKT
// in deployment). Using `new Date(str)` parses as UTC midnight, which can
// shift the date by one day when combined with `.setHours(0,0,0,0)`.
function parseLocalDate(dateString) {
  if (!dateString) return null;
  // Accept either YYYY-MM-DD or full ISO; for YYYY-MM-DD build local midnight.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }
  const dt = new Date(dateString);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

// GET /api/prayer-times - Public
// Optional query params:
//   mosqueId  — scope to one mosque
//   date      — YYYY-MM-DD; if provided, that date is returned as `today`
//               (used by the admin page to load a specific date for editing).
//   weekStart — YYYY-MM-DD; if provided, the 7-day window starts here.
//               Defaults to today if both `date` and `weekStart` are absent.
router.get('/', async (req, res, next) => {
  try {
    const { mosqueId } = req.query;
    if (mosqueId && !isValidObjectId(mosqueId)) {
      return res.status(400).json({ success: false, message: 'Invalid mosqueId' });
    }

    const focusDate = parseLocalDate(req.query.date) || (() => {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      return t;
    })();

    const todayPrayer = await PrayerTime.findOne({
      date: { $gte: focusDate, $lt: new Date(focusDate.getTime() + 86400000) },
      ...(mosqueId ? { mosqueId } : {}),
    });

    const weekStart = parseLocalDate(req.query.weekStart) || focusDate;
    const endOfWeek = new Date(weekStart.getTime() + 7 * 86400000);
    const weekPrayers = await PrayerTime.find({
      date: { $gte: weekStart, $lt: endOfWeek },
      ...(mosqueId ? { mosqueId } : {}),
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        today: todayPrayer || { fajr: '05:30', zuhr: '12:45', asr: '15:45', maghrib: '18:25', isha: '19:45', jummah: '13:00', sunrise: '06:45', eidUlFitr: '', eidUlAdha: '' },
        week: weekPrayers,
      },
    });
  } catch (error) { next(error); }
});

// PUT /api/prayer-times - Update prayer times (admin)
// Admin can upsert ANY date (past, today, future). The unique compound index
// (date, mosqueId) ensures exactly one row per date+mosque.
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
    // FIX-PRAYER-002 (BUG-PRAYER-007): optional sunrise validation
    body('sunrise').optional({ checkFalsy: true }).isString().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid sunrise time'),
    body('eidUlFitr').optional().isString().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid Eid ul-Fitr time'),
    body('eidUlAdha').optional().isString().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid Eid ul-Adha time'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    const { date, fajr, zuhr, asr, maghrib, isha, jummah, sunrise, eidUlFitr, eidUlAdha } = req.body;
    // FIX-PRAYER-001 (BUG-PRAYER-011): parse YYYY-MM-DD as local midnight, not UTC
    const targetDate = parseLocalDate(date);
    if (!targetDate) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const prayerTime = await PrayerTime.findOneAndUpdate(
      { date: targetDate, mosqueId: req.user.mosqueId },
      {
        date: targetDate,
        fajr,
        zuhr,
        asr,
        maghrib,
        isha,
        jummah,
        sunrise,
        eidUlFitr,
        eidUlAdha,
        mosqueId: req.user.mosqueId,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: prayerTime });
  } catch (error) { next(error); }
});

module.exports = router;