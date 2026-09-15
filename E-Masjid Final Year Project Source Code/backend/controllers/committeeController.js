const User = require('../models/User');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');
const { tryOrNext } = require('../utils/asyncRoute');

const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function generateTempPassword() {
  let out = '';
  for (let i = 0; i < 10; i += 1) {
    out += TEMP_PASSWORD_CHARS.charAt(Math.floor(Math.random() * TEMP_PASSWORD_CHARS.length));
  }
  return out;
}

const listMembers = tryOrNext(async (req, res) => {
  const members = await User.find({ role: 'committee', mosqueId: req.user.mosqueId }).select('-password');
  res.json({ success: true, data: members });
});

const createMember = tryOrNext(async (req, res) => {
  const email = sanitizeString(req.body.email).toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw httpError(400, 'Email already registered');

  const providedPassword = typeof req.body.password === 'string' ? req.body.password : '';
  const trimmedPassword = providedPassword.trim();
  const finalPassword = trimmedPassword.length >= 6 ? trimmedPassword : generateTempPassword();

  const member = await User.create({
    name: sanitizeString(req.body.name),
    email,
    phone: sanitizeString(req.body.phone || ''),
    password: finalPassword,
    role: 'committee',
    mosqueId: req.user.mosqueId,
  });

  res.status(201).json({
    success: true,
    data: { id: member._id, name: member.name, email: member.email, phone: member.phone, isActive: member.isActive },
    password: finalPassword,
    message: 'Committee member created',
  });
});

const updateMember = tryOrNext(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw httpError(400, 'Invalid member id');
  const member = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'committee', mosqueId: req.user.mosqueId },
    req.body,
    { new: true, runValidators: true }
  ).select('-password');
  if (!member) throw httpError(404, 'Member not found');
  res.json({ success: true, data: member });
});

const resetMemberPassword = tryOrNext(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid member id');
  if (typeof password !== 'string' || password.length < 6 || password.length > 64) {
    throw httpError(400, 'Password must be between 6 and 64 characters');
  }

  const member = await User.findOne({ _id: id, role: 'committee', mosqueId: req.user.mosqueId }).select('+password');
  if (!member) throw httpError(404, 'Member not found');

  member.password = password;
  await member.save();

  res.json({ success: true, password, message: 'Password reset successful' });
});

const removeMember = tryOrNext(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw httpError(400, 'Invalid member id');
  const member = await User.findOneAndDelete({
    _id: req.params.id,
    role: 'committee',
    mosqueId: req.user.mosqueId,
  });
  if (!member) throw httpError(404, 'Member not found');
  res.json({ success: true, message: 'Member removed' });
});

module.exports = { listMembers, createMember, updateMember, resetMemberPassword, removeMember };
