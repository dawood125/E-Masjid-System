const Campaign = require('../models/Campaign');
const Testimonial = require('../models/Testimonial');
const HeroSlide = require('../models/HeroSlide');
const Donation = require('../models/Donation');
const FundRequest = require('../models/FundRequest');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Mosque = require('../models/Mosque');
const User = require('../models/User');
const NikahBooking = require('../models/NikahBooking');

function yearsSinceOldestMosque() {
  return Mosque.findOne({ isActive: true })
    .sort({ createdAt: 1 })
    .select('createdAt')
    .lean()
    .then((oldest) => {
      if (!oldest) return 0;
      const ms = Date.now() - new Date(oldest.createdAt).getTime();
      return Math.max(1, Math.floor(ms / (365.25 * 24 * 3600 * 1000)));
    });
}

async function aggregateStats() {
  const donationAgg = await Donation.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const [yearsServing, totalDonationsPKR, activeRequests, familiesHelped] = await Promise.all([
    yearsSinceOldestMosque(),
    donationAgg[0]?.total || 0,
    FundRequest.countDocuments({ status: 'pending' }),
    FundRequest.countDocuments({ status: { $in: ['approved', 'fulfilled'] } }),
  ]);
  return { yearsServing, totalDonationsPKR, activeRequests, familiesHelped };
}

async function aggregateImpact() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const prayersTrackedRow = await Announcement.aggregate([
    { $match: { createdAt: { $gte: ninetyDaysAgo } } },
    { $count: 'count' },
  ]);
  const prayersTracked = prayersTrackedRow[0]?.count || 0;
  const totalUsers = await User.countDocuments({ isActive: true });
  const prayersEstimated = Math.max(prayersTracked * 50, totalUsers * 200);

  const [studentsTaught, familiesSupported, nikahHosted] = await Promise.all([
    Event.countDocuments({ isActive: true }),
    FundRequest.countDocuments({ status: { $in: ['approved', 'fulfilled'] } }),
    NikahBooking.countDocuments({ status: 'accepted' }),
  ]);

  return {
    prayersTracked: prayersEstimated,
    studentsTaught: studentsTaught * 10,
    nikahHosted,
    familiesSupported,
  };
}

function featuredCampaign() {
  return Campaign.findOne({ isFeatured: true, isActive: true })
    .sort({ updatedAt: -1 })
    .lean({ virtuals: true });
}

function listCampaigns() {
  return Campaign.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .lean({ virtuals: true });
}

function listTestimonials() {
  return Testimonial.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .lean();
}

function listHeroSlides() {
  return HeroSlide.find({ isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();
}

module.exports = {
  aggregateStats,
  aggregateImpact,
  featuredCampaign,
  listCampaigns,
  listTestimonials,
  listHeroSlides,
};
