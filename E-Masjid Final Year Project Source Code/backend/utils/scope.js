const Mosque = require('../models/Mosque');
const { isValidObjectId } = require('../middleware/validate');

async function getManagedMosqueIds(userId) {
  const managed = await Mosque.find({ managerId: userId }).select('_id');
  return managed.map((m) => String(m._id));
}

// Resolves the mosqueId scope for the caller.
//   - manager: returns { $in: managedIds } unless they passed ?mosqueId= which
//     must be one of their managed ids. They're cross-mosque by design.
//   - admin/scholar/committee: forced to req.user.mosqueId.
//   - anyone with no mosqueId on their user record: rejected.
async function resolveScope(req, { allowManagerPick = false } = {}) {
  if (req.user.role === 'manager') {
    const managedIds = await getManagedMosqueIds(req.user._id);
    if (managedIds.length === 0) return { error: 'You do not manage any mosques.' };
    if (allowManagerPick && req.query.mosqueId && isValidObjectId(req.query.mosqueId)) {
      if (!managedIds.includes(req.query.mosqueId)) {
        return { error: 'You can only act on mosques you manage.' };
      }
      return { scope: req.query.mosqueId };
    }
    return { scope: { $in: managedIds } };
  }
  if (!req.user.mosqueId) {
    return { error: 'Your account is not assigned to a mosque. Contact your manager.' };
  }
  return { scope: req.user.mosqueId };
}

module.exports = { resolveScope, getManagedMosqueIds };