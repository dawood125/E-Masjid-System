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

function yearsSinceMosqueCreated(mosqueId) {
  if (!mosqueId) return Promise.resolve(0);
  return Mosque.findById(mosqueId)
    .select('createdAt')
    .lean()
    .then((m) => {
      if (!m) return 0;
      const ms = Date.now() - new Date(m.createdAt).getTime();
      return Math.max(1, Math.floor(ms / (365.25 * 24 * 3600 * 1000)));
    });
}

async function aggregateStats(mosqueId) {
  const oid = mosqueId ? require('mongoose').Types.ObjectId.createFromHexString(mosqueId) : null;
  const donationAgg = oid ? await Donation.aggregate([
    { $match: { mosqueId: oid } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]) : [];
  const [yearsServing, totalDonationsPKR, activeRequests, familiesHelped] = await Promise.all([
    yearsSinceMosqueCreated(mosqueId),
    donationAgg[0]?.total || 0,
    FundRequest.countDocuments(mosqueId ? { status: 'pending', mosqueId: oid } : { status: 'pending' }),
    FundRequest.countDocuments(mosqueId ? { status: { $in: ['approved', 'fulfilled'] }, mosqueId: oid } : { status: { $in: ['approved', 'fulfilled'] } }),
  ]);
  return { yearsServing, totalDonationsPKR, activeRequests, familiesHelped };
}

async function aggregateImpact(mosqueId) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000);
  const oid = mosqueId ? require('mongoose').Types.ObjectId.createFromHexString(mosqueId) : null;
  const userFilter = mosqueId ? { isActive: true, mosqueId: oid } : { isActive: true };
  const eventFilter = mosqueId ? { isActive: true, mosqueId: oid } : { isActive: true };
  const frFilter = mosqueId ? { status: { $in: ['approved', 'fulfilled'] }, mosqueId: oid } : { status: { $in: ['approved', 'fulfilled'] } };
  const nbFilter = mosqueId ? { status: 'accepted', mosqueId: oid } : { status: 'accepted' };

  const prayersTrackedRow = oid ? await Announcement.aggregate([
    { $match: { createdAt: { $gte: ninetyDaysAgo }, mosqueId: oid } },
    { $count: 'count' },
  ]) : [];
  const prayersTracked = prayersTrackedRow[0]?.count || 0;
  const totalUsers = await User.countDocuments(userFilter);
  const prayersEstimated = Math.max(prayersTracked * 50, totalUsers * 200);

  const [studentsTaught, familiesSupported, nikahHosted] = await Promise.all([
    Event.countDocuments(eventFilter),
    FundRequest.countDocuments(frFilter),
    NikahBooking.countDocuments(nbFilter),
  ]);

  return {
    prayersTracked: prayersEstimated,
    studentsTaught: studentsTaught * 10,
    nikahHosted,
    familiesSupported,
  };
}

async function resolveMosqueId(mosqueId) {
  if (mosqueId && /^[a-f0-9]{24}$/i.test(mosqueId)) {
    const exists = await Mosque.exists({ _id: mosqueId, isActive: true });
    if (exists) return mosqueId;
  }
  const fallback = await Mosque.findOne({ isActive: true })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();
  return fallback ? fallback._id.toString() : null;
}

function featuredCampaign(mosqueId) {
  return Campaign.findOne({ isFeatured: true, isActive: true, mosqueId })
    .sort({ updatedAt: -1 })
    .lean({ virtuals: true });
}

function listCampaigns(mosqueId) {
  return Campaign.find({ isActive: true, mosqueId })
    .sort({ order: 1, createdAt: -1 })
    .lean({ virtuals: true });
}

function listTestimonials(mosqueId) {
  return Testimonial.find({ isActive: true, mosqueId })
    .sort({ order: 1, createdAt: -1 })
    .lean();
}

function listHeroSlides(mosqueId) {
  return HeroSlide.find({ isActive: true, mosqueId })
    .sort({ order: 1, createdAt: 1 })
    .lean();
}

module.exports = {
  aggregateStats,
  aggregateImpact,
  resolveMosqueId,
  featuredCampaign,
  listCampaigns,
  listTestimonials,
  listHeroSlides,
};