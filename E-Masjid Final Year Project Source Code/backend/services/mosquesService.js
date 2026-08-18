const Mosque = require('../models/Mosque');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

async function listPublic() {
  return Mosque.find({ isActive: true })
    .select('name city address phone email image')
    .sort({ createdAt: -1 });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function searchPublic({ query, city }) {
  const filter = { isActive: true };
  if (query) {
    const re = new RegExp(escapeRegex(sanitizeString(query)), 'i');
    filter.$or = [{ name: re }, { city: re }, { address: re }];
  }
  if (city) {
    filter.city = new RegExp('^' + escapeRegex(sanitizeString(city)) + '$', 'i');
  }
  return Mosque.find(filter)
    .select('name city address phone email image')
    .sort({ name: 1 })
    .limit(50);
}

async function listManaged(user) {
  return Mosque.find({ managerId: user._id });
}

async function getById(id, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid mosque id');
  const filter = { _id: id };
  if (user.role === 'manager') filter.managerId = user._id;
  else if (user.mosqueId) filter._id = user.mosqueId;
  const mosque = await Mosque.findOne(filter);
  if (!mosque) throw httpError(404, 'Mosque not found');
  return mosque;
}

async function create(body, user) {
  return Mosque.create({
    ...body,
    name: sanitizeString(body.name),
    city: sanitizeString(body.city),
    managerId: user._id,
  });
}

async function update(id, body, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid mosque id');
  const mosque = await Mosque.findOneAndUpdate(
    { _id: id, managerId: user._id },
    body,
    { new: true, runValidators: true }
  );
  if (!mosque) throw httpError(404, 'Mosque not found');
  return mosque;
}

module.exports = { listPublic, searchPublic, listManaged, getById, create, update };
