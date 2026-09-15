const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireRole } = require('../utils/routeHelpers');
const ctrl = require('../controllers/scholarsController');

router.get('/', ...requireRole('admin'), ctrl.listScholars);

router.post('/', ...requireRole('admin'), [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
  body('specialization').optional().isString().trim().isLength({ min: 2, max: 100 }).withMessage('Invalid specialization'),
  body('password').optional().isString().isLength({ min: 6, max: 64 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
], ctrl.createScholar);

router.put('/:id', ...requireRole('admin'), [
  body('name').optional().isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').optional().isString().trim().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
  body('specialization').optional().isString().trim().isLength({ min: 2, max: 100 }).withMessage('Invalid specialization'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  handleValidation,
], ctrl.updateScholar);

router.post('/:id/reset-password', ...requireRole('admin'), [
  body('password').isString().isLength({ min: 6, max: 64 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
], ctrl.resetScholarPassword);

module.exports = router;
