const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/nikahBookingsController');

router.get('/', protect, ctrl.listBookings);

router.get('/availability', protect, ctrl.getAvailability);

router.post('/', protect, authorize('community'), [
  body('groomName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Groom name is required'),
  body('brideName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Bride name is required'),
  body('preferredDate').isISO8601().withMessage('Valid preferredDate is required'),
  body('preferredTime').isString().trim().isLength({ min: 3, max: 20 }).withMessage('Valid preferredTime is required'),
  body('contact').isString().trim().isLength({ min: 7, max: 40 }).withMessage('Valid contact is required'),
  body('notes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
  handleValidation,
], ctrl.createBooking);

router.put('/:id', protect, authorize('scholar', 'admin'), [
  body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected'),
  body('confirmedDate').optional().isISO8601().withMessage('confirmedDate must be valid date'),
  body('confirmedTime').optional().isString().trim().isLength({ min: 3, max: 20 }).withMessage('Invalid confirmedTime'),
  body('rejectionReason').optional().isString().trim().isLength({ min: 3, max: 500 }).withMessage('Invalid rejectionReason'),
  handleValidation,
], ctrl.reviewBooking);

router.put('/:id/assign', protect, authorize('admin'), [
  body('scholarId').isMongoId().withMessage('Valid scholarId is required'),
  handleValidation,
], ctrl.assignBooking);

router.put('/:id/cancel', protect, authorize('community'), ctrl.cancelBooking);

module.exports = router;
