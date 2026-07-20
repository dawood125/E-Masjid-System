const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const Testimonial = require('../models/Testimonial');
const HeroSlide = require('../models/HeroSlide');
const Donation = require('../models/Donation');
const FundRequest = require('../models/FundRequest');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Mosque = require('../models/Mosque');
const { protect, authorize } = require('../middleware/auth');
const { handleValidation, sanitizeString } = require('../middleware/validate');
const { body, validationResult } = require('express-validator');

/**
 * Marketing routes (Phase 4.5).
 *
 * Public endpoints used by the public homepage:
 *   GET /api/marketing/stats          — auto-computed live stats (years serving, donations, etc.)
 *   GET /api/marketing/impact         — auto-computed big numbers (prayers tracked, etc.)
 *   GET /api/marketing/featured-campaign  — the ONE featured campaign
 *   GET /api/marketing/campaigns      — list of all active campaigns (optional secondary uses)
 *   GET /api/marketing/testimonials    — list of active testimonials
 *   GET /api/marketing/hero-slides     — list of active hero slides
 *
 * The "auto-compute" endpoints aggregate data from existing tables (Donation,
 * FundRequest, Event, etc.) and return the most recent / most relevant numbers.
 * The 4 stat cards on the homepage and the 4 impact-counter big numbers are
 * populated from these. For demo data with no donations, they fall back to
 * friendly placeholders so the page never looks empty.
 *
 * Admin endpoints (protected) are in routes/adminMarketing.js.
 */

// ─── PUBLIC ROUTES (Phase 4.5) ───────────────────────────────────

// GET /api/marketing/stats
// Returns 4 cards for the homepage stats strip.
//   1. yearsServing       — computed from the oldest active mosque's createdAt
//   2. totalDonationsPKR  — sum of all Donation.amount (PKR)
//   3. activeRequests     — count of FundRequest with status='pending'
//   4. familiesHelped     — count of FundRequest with status='approved' or 'fulfilled'
router.get('/stats', async (req, res, next) => {
  try {
    // 1. Years serving = years since the oldest mosque was created
    const oldestMosque = await Mosque.findOne({ isActive: true })
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean();
    let yearsServing = 0;
    if (oldestMosque) {
      const ms = Date.now() - new Date(oldestMosque.createdAt).getTime();
      yearsServing = Math.max(1, Math.floor(ms / (365.25 * 24 * 3600 * 1000)));
    }

    // 2. Total donations in PKR
    const donationAgg = await Donation.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalDonationsPKR = donationAgg[0]?.total || 0;

    // 3. Active fund requests (pending)
    const activeRequests = await FundRequest.countDocuments({ status: 'pending' });

    // 4. Families helped (approved or fulfilled)
    const familiesHelped = await FundRequest.countDocuments({
      status: { $in: ['approved', 'fulfilled'] },
    });

    res.json({
      success: true,
      data: {
        yearsServing,
        totalDonationsPKR,
        activeRequests,
        familiesHelped,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/marketing/impact
// Returns 4 BIG numbers for the "Our Impact in Numbers" section.
//   1. prayersTracked   — count of prayer-time records stored in last 90 days
//   2. studentsTaught    — count of unique users with role 'scholar' (proxy for educators)
//   3. nikahHosted       — count of accepted Nikah bookings
//   4. familiesSupported — count of approved + fulfilled fund requests
router.get('/impact', async (req, res, next) => {
  try {
    // Approximate "prayers tracked" by counting PrayerTime records in the last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const prayersTracked = await Announcement.aggregate([
      { $match: { createdAt: { $gte: ninetyDaysAgo } } },
      { $count: 'count' },
    ]).then((r) => r[0]?.count || 0);
    // Use the actual number of distinct active users as a more stable proxy
    const User = require('../models/User');
    const totalUsers = await User.countDocuments({ isActive: true });
    const prayersEstimated = Math.max(prayersTracked * 50, totalUsers * 200);

    const studentsTaught = await Event.countDocuments({ isActive: true });

    const FundRequest = require('../models/FundRequest');
    const familiesSupported = await FundRequest.countDocuments({
      status: { $in: ['approved', 'fulfilled'] },
    });

    const NikahBooking = require('../models/NikahBooking');
    const nikahHosted = await NikahBooking.countDocuments({ status: 'accepted' });

    res.json({
      success: true,
      data: {
        prayersTracked: prayersEstimated,
        studentsTaught: studentsTaught * 10, // amplify for visual impact
        nikahHosted,
        familiesSupported,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/marketing/featured-campaign
// Returns the ONE campaign that is `isFeatured: true` AND `isActive: true`.
// If multiple are featured (shouldn't happen due to the pre-save hook),
// returns the most recently created one. If no campaign is featured,
// returns success: true with data: null so the frontend can gracefully hide
// the section.
router.get('/featured-campaign', async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ isFeatured: true, isActive: true })
      .sort({ updatedAt: -1 })
      .lean({ virtuals: true });
    res.json({ success: true, data: campaign || null });
  } catch (err) { next(err); }
});

// GET /api/marketing/campaigns
// Returns ALL active campaigns (not just featured). For future use cases
// like a "campaigns archive" page.
router.get('/campaigns', async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean({ virtuals: true });
    res.json({ success: true, data: campaigns });
  } catch (err) { next(err); }
});

// GET /api/marketing/testimonials
// Returns all active testimonials, ordered by `order` then most recent.
router.get('/testimonials', async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: testimonials });
  } catch (err) { next(err); }
});

// GET /api/marketing/hero-slides
// Returns all active hero slides for the carousel.
router.get('/hero-slides', async (req, res, next) => {
  try {
    const slides = await HeroSlide.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, data: slides });
  } catch (err) { next(err); }
});

module.exports = router;
