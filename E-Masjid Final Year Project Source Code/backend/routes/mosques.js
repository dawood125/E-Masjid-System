const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { requireRole } = require('../utils/routeHelpers');
const ctrl = require('../controllers/mosquesController');

router.get('/public', ctrl.listPublic);
router.get('/search', ctrl.searchPublic);

router.get('/', ...requireRole('manager'), ctrl.listManaged);
router.get('/:id', protect, ctrl.getById);

router.post('/', ...requireRole('manager'), [
  body('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name is required'),
  body('city').isString().trim().isLength({ min: 2, max: 80 }).withMessage('City is required'),
  handleValidation,
], ctrl.create);

router.put('/:id', ...requireRole('manager'), ctrl.update);

module.exports = router;
