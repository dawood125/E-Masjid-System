const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/announcementsController');

router.get('/', ctrl.listPublic);
router.get('/admin', protect, authorize('admin', 'manager', 'scholar', 'committee'), ctrl.listForCaller);

router.post('/', protect, authorize('admin', 'manager'), [
  body('title').isString().trim().isLength({ min: 3, max: 150 }).withMessage('Title is required'),
  body('content').isString().trim().isLength({ min: 5, max: 2000 }).withMessage('Content is required'),
  body('isUrgent').optional().isBoolean().withMessage('isUrgent must be boolean'),
  body('publishDate').optional().isISO8601().withMessage('Invalid publish date'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  body('mosqueId').optional().isMongoId().withMessage('Invalid mosqueId'),
  handleValidation,
], ctrl.create);

router.put('/:id', protect, authorize('admin', 'manager'), ctrl.update);
router.delete('/:id', protect, authorize('admin', 'manager'), ctrl.remove);

module.exports = router;
