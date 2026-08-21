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
  const result = await svc.create(req.body, req.user);
  const { scholar } = result;
  res.status(201).json({
    success: true,
    data: {
      id: scholar._id,
      name: scholar.name,
      email: scholar.email,
      phone: scholar.phone,
      specialization: scholar.specialization,
      mosqueId: scholar.mosqueId,
      isActive: scholar.isActive,
    },
    tempPassword: result.password,
    message: 'Scholar account created',
  });
});

const updateScholar = tryOrNext(async (req, res) => {
  const scholar = await svc.update(req.params.id, req.body, req.user);
  res.json({ success: true, data: scholar });
});

const resetScholarPassword = tryOrNext(async (req, res) => {
  const { password } = req.body;
  const result = await svc.resetPassword(req.params.id, password, req.user);
  res.json({
    success: true,
    newPassword: result.password,
    message: 'Password has been reset. Share the new password with the scholar.',
  });
});

module.exports = { listScholars, createScholar, updateScholar, resetScholarPassword };
