const User = require('../models/User');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

async function listForAdmin(user) {
  return User.find({ role: 'committee', mosqueId: user.mosqueId }).select('-password');
}

async function create(input, user) {
  const email = sanitizeString(input.email).toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw httpError(400, 'Email already registered');

  const providedPassword = typeof input.password === 'string' ? input.password : '';
  const trimmedPassword = providedPassword.trim();
  const finalPassword = trimmedPassword.length >= 6 ? trimmedPassword : generateTempPassword();

  const member = await User.create({
    name: sanitizeString(input.name),
    email,
    phone: sanitizeString(input.phone || ''),
    password: finalPassword,
    role: 'committee',
    mosqueId: user.mosqueId,
  });

  return { member, password: finalPassword };
}

async function update(id, body, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid member id');
  const member = await User.findOneAndUpdate(
    { _id: id, role: 'committee', mosqueId: user.mosqueId },
    body,
    { new: true, runValidators: true }
  ).select('-password');
  if (!member) throw httpError(404, 'Member not found');
  return member;
}

async function resetPassword(id, newPassword, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid member id');
  if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 64) {
    throw httpError(400, 'Password must be between 6 and 64 characters');
  }

  const member = await User.findOne({ _id: id, role: 'committee', mosqueId: user.mosqueId }).select('+password');
  if (!member) throw httpError(404, 'Member not found');

  member.password = newPassword;
  await member.save();

  return { password: newPassword };
}

async function remove(id, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid member id');
  const member = await User.findOneAndDelete({
    _id: id,
    role: 'committee',
    mosqueId: user.mosqueId,
  });
  if (!member) throw httpError(404, 'Member not found');
  return member;
}

module.exports = { listForAdmin, create, update, resetPassword, remove };
