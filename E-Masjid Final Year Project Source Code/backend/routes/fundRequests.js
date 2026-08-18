const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation, isValidObjectId } = require('../middleware/validate');
const ctrl = require('../controllers/fundRequestsController');

router.get('/', protect, ctrl.list);

router.post('/', protect, authorize('community'), [
  body('requesterName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Requester name is required'),
  body('requesterEmail').isString().trim().isEmail().withMessage('Valid requester email is required'),
  body('requesterPhone').isString().trim().isLength({ min: 4, max: 20 }).withMessage('Valid requester phone is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('category').isIn(['Medical', 'Education', 'Housing', 'Food', 'Clothing', 'Debt', 'Other']).withMessage('Invalid category'),
  body('reason').isString().trim().isLength({ min: 30, max: 3000 }).withMessage('Reason must be at least 30 characters'),
  body('mosqueId').optional().custom((v) => isValidObjectId(v)).withMessage('Invalid mosqueId'),
  handleValidation,
], ctrl.create);

router.put('/:id', protect, authorize('committee', 'admin'), ctrl.review);

module.exports = router;
