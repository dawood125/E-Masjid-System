const Mosque = require('../models/Mosque');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');
const { tryOrNext } = require('../utils/asyncRoute');

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const listPublic = tryOrNext(async (req, res) => {
  const items = await Mosque.find({ isActive: true })
    .select('name city address phone email image')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: items });
});

const searchPublic = tryOrNext(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.query) {
    const re = new RegExp(escapeRegex(sanitizeString(req.query.query)), 'i');
    filter.$or = [{ name: re }, { city: re }, { address: re }];
  }
  if (req.query.city) {
    filter.city = new RegExp(escapeRegex(sanitizeString(req.query.city)), 'i');
  }
  const items = await Mosque.find(filter)
    .select('name city address phone email image')
    .sort({ name: 1 })
    .limit(50);
  res.json({ success: true, data: items });
});

const listManaged = tryOrNext(async (req, res) => {
  const items = await Mosque.find({ managerId: req.user._id });
  res.json({ success: true, data: items });
});

const getById = tryOrNext(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw httpError(400, 'Invalid mosque id');
  const filter = { _id: req.params.id };
  if (req.user.role === 'manager') filter.managerId = req.user._id;
  else if (req.user.mosqueId) filter._id = req.user.mosqueId;
  const mosque = await Mosque.findOne(filter);
  if (!mosque) throw httpError(404, 'Mosque not found');
  res.json({ success: true, data: mosque });
});

const create = tryOrNext(async (req, res) => {
  const mosque = await Mosque.create({
    ...req.body,
    name: sanitizeString(req.body.name),
    city: sanitizeString(req.body.city),
    managerId: req.user._id,
  });
  res.status(201).json({ success: true, data: mosque });
});

const update = tryOrNext(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw httpError(400, 'Invalid mosque id');
  const mosque = await Mosque.findOneAndUpdate(
    { _id: req.params.id, managerId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!mosque) throw httpError(404, 'Mosque not found');
  res.json({ success: true, data: mosque });
});

module.exports = { listPublic, searchPublic, listManaged, getById, create, update };
