const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/specialPrayersController');

router.get('/', ctrl.listPublic);

router.get('/admin', protect, authorize('admin', 'manager', 'scholar', 'committee'), ctrl.listForCaller);

router.post('/', protect, authorize('admin', 'manager'), [
  body('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('type').optional().isIn(['eid-fitr', 'eid-adha', 'shab-meraj', 'shab-barat', 'tarawih', 'janazah', 'milad-un-nabi', 'other']).withMessage('Invalid type'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Time must be HH:MM'),
  body('description').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }).withMessage('Description must be under 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('mosqueId').optional().isMongoId().withMessage('Invalid mosqueId'),
  handleValidation,
], ctrl.create);

router.put('/:id', protect, authorize('admin', 'manager'), ctrl.update);

router.patch('/:id/toggle', protect, authorize('admin', 'manager'), ctrl.toggle);

router.delete('/:id', protect, authorize('admin', 'manager'), ctrl.remove);

module.exports = router;
