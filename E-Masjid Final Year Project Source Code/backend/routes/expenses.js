const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/expensesController');

router.get('/', ctrl.listExpenses);
router.get('/summary', ctrl.summary);

router.post('/', protect, authorize('admin'), [
  body('description').isString().trim().isLength({ min: 3, max: 300 }).withMessage('Description is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('category').isIn(['Maintenance', 'Utilities', 'Salary', 'Events', 'Charity', 'Renovation', 'Education', 'Equipment', 'Other']).withMessage('Invalid category'),
  handleValidation,
], ctrl.createExpense);

router.put('/:id', protect, authorize('admin'), ctrl.updateExpense);
router.delete('/:id', protect, authorize('admin'), ctrl.removeExpense);

module.exports = router;
