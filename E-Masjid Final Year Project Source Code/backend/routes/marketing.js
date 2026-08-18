const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/marketingController');

router.get('/stats', ctrl.stats);
router.get('/impact', ctrl.impact);
router.get('/featured-campaign', ctrl.featured);
router.get('/campaigns', ctrl.campaigns);
router.get('/testimonials', ctrl.testimonials);
router.get('/hero-slides', ctrl.heroSlides);

module.exports = router;
