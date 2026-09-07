const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Mosque = require('../models/Mosque');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, sanitizeString, isValidObjectId } = require('../middleware/validate');
const { findManagedMosqueOrThrow, getManagedMosqueIds } = require('../services/scopeService');
const httpError = require('../middleware/httpError');

function generateTempPassword() {
  return Math.random().toString(36).slice(-10);
}

function userView(u, mosqueName) {
  const view = {
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    mosqueId: u.mosqueId,
    isActive: u.isActive,
  };
  if (u.specialization) view.specialization = u.specialization;
  return view;
}

router.get('/mosques', protect, authorize('manager'), async (req, res, next) => {
  try {
    const mosques = await Mosque.find({ managerId: req.user._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: mosques });
  } catch (e) { next(e); }
});

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
  } catch (e) { next(e); }
});

router.post('/mosques/:mosqueId/admin', protect, authorize('manager'), [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
  body('password').optional().isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidation,
], async (req, res, next) => {
  try {
    const mosque = await findManagedMosqueOrThrow(req, req.params.mosqueId);

    const email = sanitizeString(req.body.email).toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) throw httpError(400, 'Email already registered');

    const password = req.body.password || generateTempPassword();
    const admin = await User.create({
      name: sanitizeString(req.body.name),
      email,
      phone: sanitizeString(req.body.phone || ''),
      password,
      role: 'admin',
      mosqueId: mosque._id,
    });

    await Mosque.updateOne({ _id: mosque._id }, { $addToSet: { admins: admin._id } });

    res.status(201).json({
      success: true,
      data: userView(admin),
      generatedPassword: password,
      message: 'Admin account created for ' + mosque.name,
    });
  } catch (e) { next(e); }
});

router.post('/users', protect, authorize('manager'), [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'scholar', 'committee']).withMessage('Invalid role for super-admin onboarding'),
  body('mosqueId').isMongoId().withMessage('Invalid mosqueId'),
  body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }),
  body('password').optional().isString().isLength({ min: 8 }),
  body('specialization').optional().isString().trim().isLength({ min: 2, max: 100 }),
  handleValidation,
], async (req, res, next) => {
  try {
    const mosque = await findManagedMosqueOrThrow(req, req.body.mosqueId);

    const email = sanitizeString(req.body.email).toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) throw httpError(400, 'Email already registered');

    const password = req.body.password || generateTempPassword();
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
      data: userView(user),
      generatedPassword: password,
      message: `${req.body.role} account created for ${mosque.name}`,
    });
  } catch (e) { next(e); }
});

router.get('/users', protect, authorize('manager'), async (req, res, next) => {
  try {
    const managedIds = await getManagedMosqueIds(req.user._id);
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
    res.json({ success: true, data: users, managedMosques: [] });
  } catch (e) { next(e); }
});

router.put('/admins/:adminId', protect, authorize('manager'), [
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  handleValidation,
], async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.adminId)) throw httpError(400, 'Invalid admin id');

    const managedIds = await getManagedMosqueIds(req.user._id);
    if (managedIds.length === 0) throw httpError(404, 'Admin not found in your managed mosques');

    const admin = await User.findOne({
      _id: req.params.adminId,
      role: 'admin',
      mosqueId: { $in: managedIds },
    });
    if (!admin) throw httpError(404, 'Admin not found in your managed mosques');

    if (typeof req.body.isActive === 'boolean') {
      admin.isActive = req.body.isActive;
    }

    await admin.save();

    res.json({
      success: true,
      data: userView(admin),
      message: admin.isActive ? 'Admin activated' : 'Admin deactivated',
    });
  } catch (e) { next(e); }
});

module.exports = router;
