const Mosque = require('../models/Mosque');
const { isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

async function getManagedMosqueIds(userId) {
  const managed = await Mosque.find({ managerId: userId }).select('_id');
  return managed.map((m) => String(m._id));
}

async function resolveScope(req, { allowManagerPick = false } = {}) {
  if (req.user.role === 'manager') {
    const managedIds = await getManagedMosqueIds(req.user._id);
    if (managedIds.length === 0) throw httpError(400, 'You do not manage any mosques.');
    if (allowManagerPick && req.query.mosqueId && isValidObjectId(req.query.mosqueId)) {
      if (!managedIds.includes(req.query.mosqueId)) {
        throw httpError(400, 'You can only act on mosques you manage.');
      }
      return req.query.mosqueId;
    }
    return { $in: managedIds };
  }
  if (!req.user.mosqueId) {
    throw httpError(400, 'Your account is not assigned to a mosque. Contact your manager.');
  }
  return req.user.mosqueId;
}

async function findManagedMosqueOrThrow(req, mosqueId) {
  if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosque id');
  const mosque = await Mosque.findOne({ _id: mosqueId, managerId: req.user._id });
  if (!mosque) throw httpError(404, 'Mosque not found in your managed list');
  return mosque;
}

module.exports = { resolveScope, getManagedMosqueIds, findManagedMosqueOrThrow };
