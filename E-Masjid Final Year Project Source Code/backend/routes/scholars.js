const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/scholarsController');

router.get('/', protect, authorize('admin'), ctrl.listScholars);

router.post('/', protect, authorize('admin'), [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
  body('specialization').optional().isString().trim().isLength({ min: 2, max: 100 }).withMessage('Invalid specialization'),
  handleValidation,
], ctrl.createScholar);

router.put('/:id', protect, authorize('admin'), ctrl.updateScholar);

module.exports = router;
