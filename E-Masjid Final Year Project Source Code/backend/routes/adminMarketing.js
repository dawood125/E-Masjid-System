const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const ctrl = require('../controllers/adminMarketingController');

const validateCampaign = [
  body('title').isString().trim().isLength({ min: 3, max: 140 }).withMessage('Title must be 3-140 chars'),
  body('subtitle').optional().isString().trim().isLength({ max: 400 }),
  body('targetAmount').isFloat({ min: 0 }).withMessage('Target amount must be positive'),
  body('raisedAmount').optional().isFloat({ min: 0 }),
  body('donorCount').optional().isInt({ min: 0 }),
  body('daysLeft').optional().isInt({ min: 0 }),
  body('image').optional().isString().trim(),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
  body('order').optional().isInt({ min: 0 }),
  handleValidation,
];

const validateTestimonial = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 chars'),
  body('role').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Role is required'),
  body('quote').isString().trim().isLength({ min: 10, max: 600 }).withMessage('Quote must be 10-600 chars'),
  body('photo').optional().isString().trim(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  handleValidation,
];

const validateHeroSlide = [
  body('image').isString().trim().notEmpty().withMessage('Image URL/path is required'),
  body('mobileImage').optional().isString().trim(),
  body('caption').optional().isString().trim().isLength({ max: 140 }),
  body('link').optional().isString().trim(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  handleValidation,
];

router.get('/campaigns', protect, authorize('admin'), ctrl.listCampaigns);
router.post('/campaigns', protect, authorize('admin'), validateCampaign, ctrl.createCampaign);
router.put('/campaigns/:id', protect, authorize('admin'), ctrl.updateCampaign);
router.delete('/campaigns/:id', protect, authorize('admin'), ctrl.deleteCampaign);

router.get('/testimonials', protect, authorize('admin'), ctrl.listTestimonials);
router.post('/testimonials', protect, authorize('admin'), validateTestimonial, ctrl.createTestimonial);
router.put('/testimonials/:id', protect, authorize('admin'), ctrl.updateTestimonial);
router.delete('/testimonials/:id', protect, authorize('admin'), ctrl.deleteTestimonial);

router.get('/hero-slides', protect, authorize('admin'), ctrl.listHeroSlides);
router.post('/hero-slides', protect, authorize('admin'), validateHeroSlide, ctrl.createHeroSlide);
router.put('/hero-slides/:id', protect, authorize('admin'), ctrl.updateHeroSlide);
router.delete('/hero-slides/:id', protect, authorize('admin'), ctrl.deleteHeroSlide);

module.exports = router;
