const svc = require('../services/nikahService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listBookings = tryOrNext(async (req, res) => {
  const items = await svc.listForCaller(req.user);
  res.json({ success: true, data: items });
});

const createBooking = tryOrNext(async (req, res) => {
  const item = await svc.createBooking(req.body, req.user);
  res.status(201).json({ success: true, data: item });
});

const reviewBooking = tryOrNext(async (req, res) => {
  const updated = await svc.reviewBooking(req.params.id, req.body, req.user);
  res.json({ success: true, data: updated });
});

const assignBooking = tryOrNext(async (req, res) => {
  const updated = await svc.assignScholar(req.params.id, req.body.scholarId, req.user);
  res.json({ success: true, data: updated });
});

const cancelBooking = tryOrNext(async (req, res) => {
  const updated = await svc.cancelByApplicant(req.params.id, req.user);
  res.json({ success: true, data: updated });
});

const getAvailability = tryOrNext(async (req, res) => {
  const { from, to } = req.query;
  const data = await svc.availability({ user: req.user, from, to });
  res.json({ success: true, data });
});

module.exports = { listBookings, createBooking, reviewBooking, assignBooking, cancelBooking, getAvailability };
