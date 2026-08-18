const User = require('../models/User');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function generateTempPassword() {
  return Math.random().toString(36).slice(-8);
}

async function listForAdmin(user) {
  return User.find({ role: 'committee', mosqueId: user.mosqueId }).select('-password');
}

async function create(input, user) {
  const email = sanitizeString(input.email).toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw httpError(400, 'Email already registered');

  const member = await User.create({
    name: sanitizeString(input.name),
    email,
    phone: sanitizeString(input.phone || ''),
    password: generateTempPassword(),
    role: 'committee',
    mosqueId: user.mosqueId,
  });
  return member;
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

module.exports = { listForAdmin, create, update, remove };
