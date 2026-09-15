const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireRole } = require('../utils/routeHelpers');
const ctrl = require('../controllers/committeeController');

router.get('/', ...requireRole('admin'), ctrl.listMembers);

router.post('/', ...requireRole('admin'), [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
  body('password').optional().isString().isLength({ min: 6, max: 64 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
], ctrl.createMember);

router.put('/:id', ...requireRole('admin'), ctrl.updateMember);

router.post('/:id/reset-password', ...requireRole('admin'), [
  body('password').isString().isLength({ min: 6, max: 64 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
], ctrl.resetMemberPassword);

router.delete('/:id', ...requireRole('admin'), ctrl.removeMember);

module.exports = router;
