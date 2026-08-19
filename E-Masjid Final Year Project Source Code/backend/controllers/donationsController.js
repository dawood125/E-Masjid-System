const svc = require('../services/donationsService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listPublic = tryOrNext(async (req, res) => {
  const page = await svc.listPublic(req.query);
  res.json({ success: true, ...page });
});

const topDonors = tryOrNext(async (req, res) => {
  const ranked = await svc.aggregateTopDonors({ mosqueId: req.query.mosqueId });
  res.json({ success: true, data: ranked });
});

const summary = tryOrNext(async (req, res) => {
  const totals = await svc.aggregateSummary({ mosqueId: req.query.mosqueId });
  res.json({ success: true, data: totals });
});

const listAdmin = tryOrNext(async (req, res) => {
  const page = await svc.listAdmin(req.query, req.user);
  res.json({ success: true, ...page });
});

const createCash = tryOrNext(async (req, res) => {
  const donation = await svc.createCash(req.body, req.user);
  res.status(201).json({ success: true, data: donation });
});

const createOnline = tryOrNext(async (req, res) => {
  const result = await svc.createOnlineDonation(req.body);
  if (result.donation) {
    return res.status(201).json({ success: true, data: result.donation, transactionId: result.transactionId });
  }
  res.status(200).json({ success: true, url: result.url });
});

const update = tryOrNext(async (req, res) => {
  const donation = await svc.update(req.params.id, req.body, req.user);
  res.json({ success: true, data: donation });
});

const remove = tryOrNext(async (req, res) => {
  await svc.remove(req.params.id, req.user);
  res.json({ success: true, message: 'Donation deleted' });
});

module.exports = { listPublic, topDonors, summary, listAdmin, createCash, createOnline, update, remove };
