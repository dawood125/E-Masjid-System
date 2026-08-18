const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/mosquesController');

router.get('/public', ctrl.listPublic);
router.get('/search', ctrl.searchPublic);

router.get('/', protect, authorize('manager'), ctrl.listManaged);
router.get('/:id', protect, ctrl.getById);

router.post('/', protect, authorize('manager'), [
  body('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name is required'),
  body('city').isString().trim().isLength({ min: 2, max: 80 }).withMessage('City is required'),
  handleValidation,
], ctrl.create);

router.put('/:id', protect, authorize('manager'), ctrl.update);

module.exports = router;
