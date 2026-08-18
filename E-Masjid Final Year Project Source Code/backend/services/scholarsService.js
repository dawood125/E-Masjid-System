const User = require('../models/User');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function generateTempPassword() {
  return Math.random().toString(36).slice(-8);
}

async function listForAdmin(user) {
  return User.find({ role: 'scholar', mosqueId: user.mosqueId }).select('-password');
}

async function create(input, user) {
  const email = sanitizeString(input.email).toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) throw httpError(400, 'Email already registered');

  const scholar = await User.create({
    name: sanitizeString(input.name),
    email,
    phone: sanitizeString(input.phone || ''),
    password: generateTempPassword(),
    role: 'scholar',
    mosqueId: user.mosqueId,
    specialization: sanitizeString(input.specialization || 'Nikah Services'),
  });
  return scholar;
}

async function update(id, body, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid scholar id');
  const scholar = await User.findOneAndUpdate(
    { _id: id, role: 'scholar', mosqueId: user.mosqueId },
    body,
    { new: true, runValidators: true }
  ).select('-password');
  if (!scholar) throw httpError(404, 'Scholar not found');
  return scholar;
}

module.exports = { listForAdmin, create, update };
