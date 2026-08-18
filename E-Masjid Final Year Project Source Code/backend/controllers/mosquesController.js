const svc = require('../services/mosquesService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listPublic = tryOrNext(async (req, res) => {
  const items = await svc.listPublic();
  res.json({ success: true, data: items });
});

const searchPublic = tryOrNext(async (req, res) => {
  const items = await svc.searchPublic({ query: req.query.query, city: req.query.city });
  res.json({ success: true, data: items });
});

const listManaged = tryOrNext(async (req, res) => {
  const items = await svc.listManaged(req.user);
  res.json({ success: true, data: items });
});

const getById = tryOrNext(async (req, res) => {
  const mosque = await svc.getById(req.params.id, req.user);
  res.json({ success: true, data: mosque });
});

const create = tryOrNext(async (req, res) => {
  const mosque = await svc.create(req.body, req.user);
  res.status(201).json({ success: true, data: mosque });
});

const update = tryOrNext(async (req, res) => {
  const mosque = await svc.update(req.params.id, req.body, req.user);
  res.json({ success: true, data: mosque });
});

module.exports = { listPublic, searchPublic, listManaged, getById, create, update };
