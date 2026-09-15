const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');
const upload = require('../middleware/upload');
const { requireRole } = require('../utils/routeHelpers');
const ctrl = require('../controllers/adminMarketingController');

const uploadCampaign = upload.createUploader('marketing/campaigns');
const uploadTestimonial = upload.createUploader('marketing/testimonials');
const uploadHeroSlide = upload.createUploader('marketing/hero-slides');

const validateCampaign = [
  body('title').isString().trim().isLength({ min: 3, max: 140 }).withMessage('Title must be 3-140 chars'),
  body('subtitle').optional().isString().trim().isLength({ max: 400 }),
  body('targetAmount').isFloat({ min: 0 }).withMessage('Target amount must be positive'),
  body('raisedAmount').optional().isFloat({ min: 0 }),
  body('donorCount').optional().isInt({ min: 0 }),
  body('daysLeft').optional().isInt({ min: 0 }),
  body('image').optional({ values: 'falsy' }).isString().trim(),
  body('isActive').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
  body('order').optional().isInt({ min: 0 }),
  handleValidation,
];

const validateTestimonial = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 chars'),
  body('role').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Role is required'),
  body('quote').isString().trim().isLength({ min: 10, max: 600 }).withMessage('Quote must be 10-600 chars'),
  body('photo').optional({ values: 'falsy' }).isString().trim(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  handleValidation,
];

const validateHeroSlide = [
  body('image').optional({ values: 'falsy' }).isString().trim(),
  body('mobileImage').optional({ values: 'falsy' }).isString().trim(),
  body('caption').optional().isString().trim().isLength({ max: 140 }),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
  handleValidation,
];

function requireHeroSlideImage(req, res, next) {
  const fileUploaded =
    (req.file && req.file.fieldname === 'image') ||
    (req.files && Array.isArray(req.files.image) && req.files.image.length > 0);
  const hasUrl = typeof req.body.image === 'string' && req.body.image.trim().length > 0;
  if (!fileUploaded && !hasUrl) {
    return res.status(400).json({ success: false, message: 'Image is required (upload a file or provide a URL)' });
  }
  next();
}

router.get('/campaigns', ...requireRole('admin'), ctrl.listCampaigns);
router.post('/campaigns', ...requireRole('admin'), uploadCampaign.single('image'), validateCampaign, ctrl.createCampaign);
router.put('/campaigns/:id', ...requireRole('admin'), uploadCampaign.single('image'), ctrl.updateCampaign);
router.delete('/campaigns/:id', ...requireRole('admin'), ctrl.deleteCampaign);

router.get('/testimonials', ...requireRole('admin'), ctrl.listTestimonials);
router.post('/testimonials', ...requireRole('admin'), uploadTestimonial.single('photo'), validateTestimonial, ctrl.createTestimonial);
router.put('/testimonials/:id', ...requireRole('admin'), uploadTestimonial.single('photo'), ctrl.updateTestimonial);
router.delete('/testimonials/:id', ...requireRole('admin'), ctrl.deleteTestimonial);

router.get('/hero-slides', ...requireRole('admin'), ctrl.listHeroSlides);
router.post('/hero-slides', ...requireRole('admin'), uploadHeroSlide.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 },
]), validateHeroSlide, requireHeroSlideImage, ctrl.createHeroSlide);
router.put('/hero-slides/:id', ...requireRole('admin'), uploadHeroSlide.fields([
  { name: 'image', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 },
]), ctrl.updateHeroSlide);
router.delete('/hero-slides/:id', ...requireRole('admin'), ctrl.deleteHeroSlide);

module.exports = router;
