const PrayerTime = require('../models/PrayerTime');
const { isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

const DEFAULT_PRAYER = {
  fajr: '05:30',
  zuhr: '12:45',
  asr: '15:45',
  maghrib: '18:25',
  isha: '19:45',
  jummah: '13:00',
  sunrise: '06:45',
  eidUlFitr: '',
  eidUlAdha: '',
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

async function getWindow({ mosqueId, date, weekStart }) {
  if (mosqueId && !isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');

  const focus = parseLocalDate(date) || todayMidnight();
  const start = parseLocalDate(weekStart) || focus;
  const end = new Date(start.getTime() + 7 * 86400000);

  const filter = { ...(mosqueId ? { mosqueId } : {}) };

  const today = await PrayerTime.findOne({
    date: { $gte: focus, $lt: new Date(focus.getTime() + 86400000) },
    ...filter,
  });
  const week = await PrayerTime.find({
    date: { $gte: start, $lt: end },
    ...filter,
  }).sort({ date: 1 });

  return {
    today: today || { ...DEFAULT_PRAYER },
    week,
  };
}

async function upsertForAdmin(input, user) {
  const target = parseLocalDate(input.date);
  if (!target) throw httpError(400, 'Invalid date');

  return PrayerTime.findOneAndUpdate(
    { date: target, mosqueId: user.mosqueId },
    {
      date: target,
      fajr: input.fajr,
      zuhr: input.zuhr,
      asr: input.asr,
      maghrib: input.maghrib,
      isha: input.isha,
      jummah: input.jummah,
      sunrise: input.sunrise,
      eidUlFitr: input.eidUlFitr,
      eidUlAdha: input.eidUlAdha,
      mosqueId: user.mosqueId,
    },
    { new: true, upsert: true, runValidators: true }
  );
}

module.exports = { getWindow, upsertForAdmin };
