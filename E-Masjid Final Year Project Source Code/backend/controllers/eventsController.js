const eventsService = require('../services/eventsService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listPublic = tryOrNext(async (req, res) => {
  const events = await eventsService.listPublic({ mosqueId: req.query.mosqueId });
  res.json({ success: true, data: events });
});

const listForCaller = tryOrNext(async (req, res) => {
  const events = await eventsService.listForCaller(req);
  res.json({ success: true, data: events });
});

const getById = tryOrNext(async (req, res) => {
  const event = await eventsService.getById(req.params.id);
  res.json({ success: true, data: event });
});

const create = tryOrNext(async (req, res) => {
  const imagePath = req.file ? '/uploads/events/' + req.file.filename : undefined;
  const event = await eventsService.create(req.body, req.user, imagePath);
  res.status(201).json({ success: true, data: event });
});

const update = tryOrNext(async (req, res) => {
  const event = await eventsService.update(req.params.id, req.body, req);
  res.json({ success: true, data: event });
});

const remove = tryOrNext(async (req, res) => {
  await eventsService.remove(req.params.id, req);
  res.json({ success: true, message: 'Event deleted' });
});

const register = tryOrNext(async (req, res) => {
  const event = await eventsService.registerAttendee(req.params.id, req.user);
  res.json({ success: true, message: 'Registered successfully', data: event });
});

module.exports = { listPublic, listForCaller, getById, create, update, remove, register };
