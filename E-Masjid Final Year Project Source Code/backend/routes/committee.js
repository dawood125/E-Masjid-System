const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/committeeController');

router.get('/', protect, authorize('admin'), ctrl.listMembers);

router.post('/', protect, authorize('admin'), [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name is required'),
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Invalid phone'),
  handleValidation,
], ctrl.createMember);

router.put('/:id', protect, authorize('admin'), ctrl.updateMember);
router.delete('/:id', protect, authorize('admin'), ctrl.removeMember);

module.exports = router;
