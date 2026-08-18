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

module.exports = { listBookings, createBooking, reviewBooking };
