const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/nikahBookingsController');

router.get('/', protect, ctrl.listBookings);

router.get('/availability', protect, ctrl.getAvailability);

router.post('/', protect, authorize('community'), [
  body('groomName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Groom name must be 2 to 100 characters'),
  body('brideName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Bride name must be 2 to 100 characters'),
  body('ceremonyDate').isISO8601().withMessage('Valid ceremony date is required'),
  body('ceremonyTime').isString().trim().isLength({ min: 3, max: 20 }).withMessage('Valid ceremony time is required'),
  body('phone').isString().trim().isLength({ min: 7, max: 20 }).withMessage('Phone number must be 7 to 20 characters'),
  body('email').isString().trim().isEmail().withMessage('Valid email address is required'),
  body('address').isString().trim().isLength({ min: 3, max: 500 }).withMessage('Address must be 3 to 500 characters'),
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
