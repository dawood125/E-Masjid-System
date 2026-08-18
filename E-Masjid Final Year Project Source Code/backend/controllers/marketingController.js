const svc = require('../services/marketingService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const stats = tryOrNext(async (req, res) => {
  const data = await svc.aggregateStats();
  res.json({ success: true, data });
});

const impact = tryOrNext(async (req, res) => {
  const data = await svc.aggregateImpact();
  res.json({ success: true, data });
});

const featured = tryOrNext(async (req, res) => {
  const data = await svc.featuredCampaign();
  res.json({ success: true, data: data || null });
});

const campaigns = tryOrNext(async (req, res) => {
  const data = await svc.listCampaigns();
  res.json({ success: true, data });
});

const testimonials = tryOrNext(async (req, res) => {
  const data = await svc.listTestimonials();
  res.json({ success: true, data });
});

const heroSlides = tryOrNext(async (req, res) => {
  const data = await svc.listHeroSlides();
  res.json({ success: true, data });
});

module.exports = { stats, impact, featured, campaigns, testimonials, heroSlides };
