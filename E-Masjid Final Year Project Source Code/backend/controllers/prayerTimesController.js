const PrayerTime = require('../models/PrayerTime');
const { isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');
const { tryOrNext } = require('../utils/asyncRoute');

const DEFAULT_PRAYER = {
  fajr: '05:30',
  zuhr: '12:45',
  asr: '15:45',
  maghrib: '18:25',
  isha: '19:45',
  jummah: '13:00',
  sunrise: '06:45',
};

function parseLocalDate(str) {
  if (!str) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }
  const dt = new Date(str);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function todayMidnight() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

const get = tryOrNext(async (req, res) => {
  const mosqueId = req.query.mosqueId;
  const date = req.query.date;
  const weekStart = req.query.weekStart;
  if (mosqueId && !isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');

  const focus = parseLocalDate(date) || todayMidnight();
  const start = parseLocalDate(weekStart) || focus;
  const end = new Date(start.getTime() + 7 * 86400000);

  const filter = { ...(mosqueId ? { mosqueId } : {}) };

  const [today, week] = await Promise.all([
    PrayerTime.findOne({
      date: { $gte: focus, $lt: new Date(focus.getTime() + 86400000) },
      ...filter,
    }),
    PrayerTime.find({
      date: { $gte: start, $lt: end },
      ...filter,
    }).sort({ date: 1 }),
  ]);

  res.json({
    success: true,
    data: {
      today: today || { ...DEFAULT_PRAYER },
      week,
    },
  });
});

const upsert = tryOrNext(async (req, res) => {
  const target = parseLocalDate(req.body.date);
  if (!target) throw httpError(400, 'Invalid date');

  const row = await PrayerTime.findOneAndUpdate(
    { date: target, mosqueId: req.user.mosqueId },
    {
      date: target,
      fajr: req.body.fajr,
      zuhr: req.body.zuhr,
      asr: req.body.asr,
      maghrib: req.body.maghrib,
      isha: req.body.isha,
      jummah: req.body.jummah,
      sunrise: req.body.sunrise,
      mosqueId: req.user.mosqueId,
    },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: row });
});

module.exports = { get, upsert };
