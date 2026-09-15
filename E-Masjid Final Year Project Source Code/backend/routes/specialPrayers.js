const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const { requireRole } = require('../utils/routeHelpers');
const { ALLOWED_TYPES } = require('../controllers/specialPrayersController');
const ctrl = require('../controllers/specialPrayersController');

router.get('/', ctrl.listPublic);

router.get('/admin', ...requireRole('admin', 'manager', 'scholar', 'committee'), ctrl.listForCaller);

router.post('/', ...requireRole('admin', 'manager'), [
  body('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('type').optional().isIn(ALLOWED_TYPES).withMessage('Invalid type'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be HH:MM'),
  body('description').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('mosqueId').optional().isMongoId().withMessage('Invalid mosqueId'),
  handleValidation,
], ctrl.create);

router.put('/:id', ...requireRole('admin', 'manager'), ctrl.update);

router.patch('/:id/toggle', ...requireRole('admin', 'manager'), ctrl.toggle);

router.delete('/:id', ...requireRole('admin', 'manager'), ctrl.remove);

module.exports = router;
