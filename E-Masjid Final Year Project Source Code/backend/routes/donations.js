const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation, isValidObjectId } = require('../middleware/validate');
const ctrl = require('../controllers/donationsController');

router.get('/', ctrl.listPublic);
router.get('/top-donors', ctrl.topDonors);
router.get('/summary', ctrl.summary);

router.get('/admin', protect, authorize('admin', 'manager'), ctrl.listAdmin);

router.post('/', protect, authorize('admin'), [
  body('donorName').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Donor name is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['Sadaqah', 'Zakat', 'Masjid Fund']).withMessage('Invalid donation type'),
  body('paymentMethod').optional().isIn(['Cash', 'Card', 'Online']).withMessage('Invalid payment method'),
  handleValidation,
], ctrl.createCash);

router.post('/online', [
  body('donorName').optional().isString().trim().isLength({ min: 2, max: 100 }).withMessage('Invalid donor name'),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').optional().isIn(['Sadaqah', 'Zakat', 'Masjid Fund']).withMessage('Invalid donation type'),
  body('mosqueId').optional({ nullable: true, checkFalsy: true }).custom((v) => isValidObjectId(v)).withMessage('Invalid mosqueId'),
  handleValidation,
], ctrl.createOnline);

router.put('/:id', protect, authorize('admin'), ctrl.update);
router.delete('/:id', protect, authorize('admin'), ctrl.remove);

module.exports = router;
