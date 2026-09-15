const User = require('../models/User');
const NikahBooking = require('../models/NikahBooking');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');
const { tryOrNext } = require('../utils/asyncRoute');

const ALLOWED_UPDATE_FIELDS = ['name', 'email', 'phone', 'specialization', 'isActive'];

function generateTempPassword() {
  return Math.random().toString(36).slice(-8);
}

async function attachNikahCounts(scholars, mosqueId) {
  if (scholars.length === 0) return scholars;

  const ids = scholars.map((s) => s._id);

  const [acceptedAgg, pendingCount] = await Promise.all([
    NikahBooking.aggregate([
      { $match: { mosqueId, status: 'accepted', scholarId: { $in: ids } } },
      { $group: { _id: '$scholarId', count: { $sum: 1 } } },
    ]),
    NikahBooking.countDocuments({ mosqueId, status: 'pending' }),
  ]);

  const acceptedMap = new Map(acceptedAgg.map((r) => [String(r._id), r.count]));

  return scholars.map((scholar) => {
    const sid = String(scholar._id);
    return {
      ...scholar,
      id: scholar._id,
      nikahPerformed: acceptedMap.get(sid) || 0,
      pendingRequests: pendingCount,
    };
  });
}

const listScholars = tryOrNext(async (req, res) => {
  const oid = req.user.mosqueId;
  if (!oid) return res.json({ success: true, data: [] });
  const scholars = await User.find({ role: 'scholar', mosqueId: oid }).select('-password').lean();
  const data = await attachNikahCounts(scholars, oid);
  res.json({ success: true, data });
});

const createScholar = tryOrNext(async (req, res) => {
  const input = req.body;
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
    mosqueId: req.user.mosqueId,
    specialization: sanitizeString(input.specialization || 'Nikah Services'),
  });

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
      nikahPerformed: 0,
      pendingRequests: 0,
    },
    tempPassword: finalPassword,
    message: 'Scholar account created',
  });
});

const updateScholar = tryOrNext(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw httpError(400, 'Invalid scholar id');

  const update = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (req.body[field] === undefined) continue;
    if (field === 'email') {
      update.email = sanitizeString(req.body.email).toLowerCase();
    } else if (typeof req.body[field] === 'string') {
      update[field] = sanitizeString(req.body[field]);
    } else {
      update[field] = req.body[field];
    }
  }

  if (Object.keys(update).length === 0) throw httpError(400, 'No editable fields provided');

  const scholar = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'scholar', mosqueId: req.user.mosqueId },
    update,
    { new: true, runValidators: true }
  ).select('-password');
  if (!scholar) throw httpError(404, 'Scholar not found');
  res.json({ success: true, data: scholar });
});

const resetScholarPassword = tryOrNext(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid scholar id');
  if (typeof password !== 'string' || password.length < 6) {
    throw httpError(400, 'Password must be at least 6 characters');
  }

  const scholar = await User.findOne({ _id: id, role: 'scholar', mosqueId: req.user.mosqueId }).select('+password');
  if (!scholar) throw httpError(404, 'Scholar not found');

  scholar.password = password;
  await scholar.save();

  res.json({
    success: true,
    newPassword: password,
    message: 'Password has been reset. Share the new password with the scholar.',
  });
});

module.exports = { listScholars, createScholar, updateScholar, resetScholarPassword, attachNikahCounts };
