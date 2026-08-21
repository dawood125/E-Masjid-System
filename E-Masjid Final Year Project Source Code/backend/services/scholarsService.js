const User = require('../models/User');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

const ALLOWED_UPDATE_FIELDS = ['name', 'email', 'phone', 'specialization', 'isActive'];

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

  const providedPassword = typeof input.password === 'string' ? input.password : '';
  const trimmedPassword = providedPassword.trim();
  const finalPassword = trimmedPassword.length >= 6 ? trimmedPassword : generateTempPassword();

  const scholar = await User.create({
    name: sanitizeString(input.name),
    email,
    phone: sanitizeString(input.phone || ''),
    password: finalPassword,
    role: 'scholar',
    mosqueId: user.mosqueId,
    specialization: sanitizeString(input.specialization || 'Nikah Services'),
  });

  return { scholar, password: finalPassword };
}

async function update(id, body, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid scholar id');

  const update = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (body[field] === undefined) continue;
    if (field === 'email') {
      update.email = sanitizeString(body.email).toLowerCase();
    } else if (typeof body[field] === 'string') {
      update[field] = sanitizeString(body[field]);
    } else {
      update[field] = body[field];
    }
  }

  if (Object.keys(update).length === 0) throw httpError(400, 'No editable fields provided');

  const scholar = await User.findOneAndUpdate(
    { _id: id, role: 'scholar', mosqueId: user.mosqueId },
    update,
    { new: true, runValidators: true }
  ).select('-password');
  if (!scholar) throw httpError(404, 'Scholar not found');
  return scholar;
}

async function resetPassword(id, newPassword, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid scholar id');
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    throw httpError(400, 'Password must be at least 6 characters');
  }

  const scholar = await User.findOne({ _id: id, role: 'scholar', mosqueId: user.mosqueId }).select('+password');
  if (!scholar) throw httpError(404, 'Scholar not found');

  scholar.password = newPassword;
  await scholar.save();

  return { password: newPassword };
}

module.exports = { listForAdmin, create, update, resetPassword };
