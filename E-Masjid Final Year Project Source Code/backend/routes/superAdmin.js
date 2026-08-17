/**
 * Super Admin (Manager) routes
 *
 * NOTE: In this codebase the 'manager' role IS our cross-mosque operator
 * (super admin). The internal role name stays 'manager' for consistency
 * with existing docs, but the user-facing flow is platform-admin style:
 * they create masjids, create the first admin of each masjid, and can
 * see every masjid's data for support/billing.
 *
 * All routes here are gated by `protect` + `authorize('manager')`.
 * Manager scope is via `Mosque.managerId === req.user._id` — the manager
 * does NOT have a user.mosqueId; their scope is the union of mosques
 * they manage.
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Mosque = require('../models/Mosque');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

/** Helper: confirm this manager owns the mosque. Returns { mosque, error } */
async function findManagedMosque(req, res, mosqueId) {
  if (!isValidObjectId(mosqueId)) {
    res.status(400).json({ success: false, message: 'Invalid mosque id' });
    return null;
  }
  const mosque = await Mosque.findOne({ _id: mosqueId, managerId: req.user._id });
  if (!mosque) {
    res.status(404).json({ success: false, message: 'Mosque not found in your managed list' });
    return null;
  }
  return mosque;
}

// GET /api/super-admin/mosques
// List all masjids this manager manages (full record including enabledModules + admins).
router.get('/mosques', protect, authorize('manager'), async (req, res, next) => {
  try {
    const mosques = await Mosque.find({ managerId: req.user._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: mosques });
  } catch (error) { next(error); }
});

// GET /api/super-admin/admins
// List all admin accounts across the masjids this manager manages. Used by
// the Super Admin panel for support (e.g. reset a password, see which masjid
// an admin belongs to). Admins must belong to one of the manager's masjids.
router.get('/admins', protect, authorize('manager'), async (req, res, next) => {
  try {
    const managedMosques = await Mosque.find({ managerId: req.user._id }).select('_id name');
    const managedIds = managedMosques.map((m) => m._id);
    if (managedIds.length === 0) {
      return res.json({ success: true, data: [], managedMosques: [] });
    }
    const admins = await User.find({ role: 'admin', mosqueId: { $in: managedIds } })
      .populate('mosqueId', 'name city')
      .select('-password');
    res.json({ success: true, data: admins, managedMosques });
  } catch (error) { next(error); }
});

// POST /api/super-admin/mosques/:mosqueId/admin
// Create the first admin for a masjid. The masjid MUST be one this manager
// already owns. We then push the new admin's id into Mosque.admins and set
// User.mosqueId on the admin.
router.post(
  '/mosques/:mosqueId/admin',
  protect,
  authorize('manager'),
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
    body('email').isString().trim().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
    body('password').optional().isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    handleValidation,
  ],
  async (req, res, next) => {
    try {
      const mosque = await findManagedMosque(req, res, req.params.mosqueId);
      if (!mosque) return;

      const email = sanitizeString(req.body.email).toLowerCase();
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // If the manager did not provide a password, generate a random 10-char
      // temp password they'd share with the new admin out-of-band (email in
      // production; console print for our demo).
      const password = req.body.password || Math.random().toString(36).slice(-10);

      const admin = await User.create({
        name: sanitizeString(req.body.name),
        email,
        phone: sanitizeString(req.body.phone || ''),
        password,
        role: 'admin',
        mosqueId: mosque._id,
      });

      // Push the admin into the mosque's admins list (idempotent: $addToSet).
      await Mosque.updateOne({ _id: mosque._id }, { $addToSet: { admins: admin._id } });

      // In production we would email the credentials. For demo we surface
      // the generated password so the developer can hand it to the new admin.
      res.status(201).json({
        success: true,
        data: {
          id: admin._id, name: admin.name, email: admin.email,
          phone: admin.phone, role: admin.role, mosqueId: admin.mosqueId,
        },
        generatedPassword: password,
        message: 'Admin account created for ' + mosque.name,
      });
    } catch (error) { next(error); }
});

// POST /api/super-admin/users
// Create a user of any role scoped to one of the manager's masjids. The
// manager passes `mosqueId` (must be one they manage) and `role` (admin /
// scholar / committee). Used for super-admin to bulk-onboard users across
// all their managed masjids.
router.post(
  '/users',
  protect,
  authorize('manager'),
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
    body('email').isString().trim().isEmail().withMessage('Valid email is required'),
    body('role').isIn(['admin', 'scholar', 'committee']).withMessage('Invalid role for super-admin onboarding'),
    body('mosqueId').isMongoId().withMessage('Invalid mosqueId'),
    body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }),
    body('password').optional().isString().isLength({ min: 8 }),
    body('specialization').optional().isString().trim().isLength({ min: 2, max: 100 }),
    handleValidation,
  ],
  async (req, res, next) => {
    try {
      const mosque = await findManagedMosque(req, res, req.body.mosqueId);
      if (!mosque) return;

      const email = sanitizeString(req.body.email).toLowerCase();
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      const password = req.body.password || Math.random().toString(36).slice(-10);

      const userData = {
        name: sanitizeString(req.body.name),
        email,
        phone: sanitizeString(req.body.phone || ''),
        password,
        role: req.body.role,
        mosqueId: mosque._id,
      };
      if (req.body.specialization && req.body.role === 'scholar') {
        userData.specialization = sanitizeString(req.body.specialization);
      }

      const user = await User.create(userData);

      if (req.body.role === 'admin') {
        await Mosque.updateOne({ _id: mosque._id }, { $addToSet: { admins: user._id } });
      }

      res.status(201).json({
        success: true,
        data: {
          id: user._id, name: user.name, email: user.email,
          phone: user.phone, role: user.role, mosqueId: user.mosqueId,
          ...(user.specialization ? { specialization: user.specialization } : {}),
        },
        generatedPassword: password,
        message: `${req.body.role} account created for ${mosque.name}`,
      });
    } catch (error) { next(error); }
});

// GET /api/super-admin/users
// List users across all the manager's managed masjids, optionally filtered
// by role. Used by the panel for a global "support" view.
router.get('/users', protect, authorize('manager'), async (req, res, next) => {
  try {
    const managedMosques = await Mosque.find({ managerId: req.user._id }).select('_id name');
    const managedIds = managedMosques.map((m) => m._id);
    if (managedIds.length === 0) {
      return res.json({ success: true, data: [], managedMosques: [] });
    }
    const filter = { mosqueId: { $in: managedIds } };
    if (req.query.role && ['admin', 'scholar', 'committee', 'community'].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    const users = await User.find(filter)
      .populate('mosqueId', 'name city')
      .select('-password');
    res.json({ success: true, data: users, managedMosques });
  } catch (error) { next(error); }
});

module.exports = router;
