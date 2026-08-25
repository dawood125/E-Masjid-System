const svc = require('../services/announcementsService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listPublic = tryOrNext(async (req, res) => {
  const page = await svc.listPublic({
    mosqueId: req.query.mosqueId,
    includeAll: req.query.includeAll,
    limit: req.query.limit,
    page: req.query.page,
  });
  res.json({ success: true, ...page });
});

const listForCaller = tryOrNext(async (req, res) => {
  const page = await svc.listForCaller(req);
  res.json({ success: true, ...page });
});

const create = tryOrNext(async (req, res) => {
  const item = await svc.create(req.body, req.user);
  res.status(201).json({ success: true, data: item });
});

const update = tryOrNext(async (req, res) => {
  const item = await svc.update(req.params.id, req.body, req);
  res.json({ success: true, data: item });
});

const remove = tryOrNext(async (req, res) => {
  await svc.remove(req.params.id, req);
  res.json({ success: true, message: 'Deleted' });
});

module.exports = { listPublic, listForCaller, create, update, remove };
