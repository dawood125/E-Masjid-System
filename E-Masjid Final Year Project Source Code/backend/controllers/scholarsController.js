const svc = require('../services/scholarsService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listScholars = tryOrNext(async (req, res) => {
  const scholars = await svc.listForAdmin(req.user);
  res.json({ success: true, data: scholars });
});

const createScholar = tryOrNext(async (req, res) => {
  const scholar = await svc.create(req.body, req.user);
  res.status(201).json({
    success: true,
    data: { id: scholar._id, name: scholar.name, email: scholar.email, phone: scholar.phone },
    message: 'Scholar account created',
  });
});

const updateScholar = tryOrNext(async (req, res) => {
  const scholar = await svc.update(req.params.id, req.body, req.user);
  res.json({ success: true, data: scholar });
});

module.exports = { listScholars, createScholar, updateScholar };
