const eventsService = require('../services/eventsService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listPublic = tryOrNext(async (req, res) => {
  const page = await eventsService.listPublic({
    mosqueId: req.query.mosqueId,
    limit: req.query.limit,
    page: req.query.page,
  });
  res.json({ success: true, ...page });
});

const listForCaller = tryOrNext(async (req, res) => {
  const page = await eventsService.listForCaller(req);
  res.json({ success: true, ...page });
});

const getById = tryOrNext(async (req, res) => {
  const event = await eventsService.getById(req.params.id);
  res.json({ success: true, data: event });
});

const getRegistrations = tryOrNext(async (req, res) => {
  const result = await eventsService.getRegistrations(req.params.id, req);
  res.json({ success: true, data: result });
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

module.exports = { listPublic, listForCaller, getById, getRegistrations, create, update, remove, register };
