const svc = require('../services/prayerTimesService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const get = tryOrNext(async (req, res) => {
  const data = await svc.getWindow({
    mosqueId: req.query.mosqueId,
    date: req.query.date,
    weekStart: req.query.weekStart,
  });
  res.json({ success: true, data });
});

const upsert = tryOrNext(async (req, res) => {
  const row = await svc.upsertForAdmin(req.body, req.user);
  res.json({ success: true, data: row });
});

module.exports = { get, upsert };
