const svc = require('../services/committeeService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listMembers = tryOrNext(async (req, res) => {
  const members = await svc.listForAdmin(req.user);
  res.json({ success: true, data: members });
});

const createMember = tryOrNext(async (req, res) => {
  const { member, password } = await svc.create(req.body, req.user);
  res.status(201).json({
    success: true,
    data: { id: member._id, name: member.name, email: member.email, phone: member.phone, isActive: member.isActive },
    password,
    message: 'Committee member created',
  });
});

const resetMemberPassword = tryOrNext(async (req, res) => {
  const { password } = await svc.resetPassword(req.params.id, req.body.password, req.user);
  res.json({ success: true, password, message: 'Password reset successful' });
});

const updateMember = tryOrNext(async (req, res) => {
  const member = await svc.update(req.params.id, req.body, req.user);
  res.json({ success: true, data: member });
});

const removeMember = tryOrNext(async (req, res) => {
  await svc.remove(req.params.id, req.user);
  res.json({ success: true, message: 'Member removed' });
});

module.exports = { listMembers, createMember, updateMember, resetMemberPassword, removeMember };
