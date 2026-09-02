const svc = require('../services/specialPrayersService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listPublic = tryOrNext(async (req, res) => {
  const items = await svc.listPublic({
    mosqueId: req.query.mosqueId,
    upcoming: req.query.upcoming,
    includeInactive: req.query.includeInactive,
    limit: req.query.limit,
  });
  res.json({ success: true, data: items });
});

const listForCaller = tryOrNext(async (req, res) => {
  const items = await svc.listForCaller(req);
  res.json({ success: true, data: items });
});

const create = tryOrNext(async (req, res) => {
  const item = await svc.create(req.body, req.user);
  res.status(201).json({ success: true, data: item });
});

const update = tryOrNext(async (req, res) => {
  const item = await svc.update(req.params.id, req.body, req);
  res.json({ success: true, data: item });
});

const toggle = tryOrNext(async (req, res) => {
  const item = await svc.toggle(req.params.id, req);
  res.json({ success: true, data: item });
});

const remove = tryOrNext(async (req, res) => {
  await svc.remove(req.params.id, req);
  res.json({ success: true, message: 'Deleted' });
});

module.exports = { listPublic, listForCaller, create, update, toggle, remove };
