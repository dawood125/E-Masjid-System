const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/prayerTimesController');

router.get('/', ctrl.get);

router.put('/', protect, authorize('admin'), [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('fajr').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid fajr time is required'),
  body('zuhr').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid zuhr time is required'),
  body('asr').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid asr time is required'),
  body('maghrib').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid maghrib time is required'),
  body('isha').isString().trim().isLength({ min: 3, max: 10 }).withMessage('Valid isha time is required'),
  body('jummah').optional().isString().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid jummah time'),
  body('sunrise').optional({ checkFalsy: true }).isString().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid sunrise time'),
  handleValidation,
], ctrl.upsert);

module.exports = router;
