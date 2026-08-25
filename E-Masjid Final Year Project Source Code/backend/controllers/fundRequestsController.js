const svc = require('../services/fundRequestsService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const create = tryOrNext(async (req, res) => {
  const item = await svc.create(req.body, req.user);
  res.status(201).json({ success: true, data: item });
});

const list = tryOrNext(async (req, res) => {
  const page = await svc.listForCaller(req.user, req.query);
  res.json({ success: true, ...page });
});

const review = tryOrNext(async (req, res) => {
  const item = await svc.review(req.params.id, req.body, req.user);
  res.json({ success: true, data: item });
});

const vote = tryOrNext(async (req, res) => {
  const item = await svc.castVote(req.params.id, req.body, req.user);
  res.json({ success: true, data: item });
});

const finalize = tryOrNext(async (req, res) => {
  const item = await svc.finalize(req.params.id, req.body, req.user);
  res.json({ success: true, data: item });
});

module.exports = { create, list, review, vote, finalize };