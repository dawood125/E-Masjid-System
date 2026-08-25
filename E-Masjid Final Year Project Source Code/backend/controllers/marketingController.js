const svc = require('../services/marketingService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const stats = tryOrNext(async (req, res) => {
  const mosqueId = await svc.resolveMosqueId(req.query.mosqueId);
  if (!mosqueId) {
    return res.json({ success: true, data: { yearsServing: 0, totalDonationsPKR: 0, activeRequests: 0, familiesHelped: 0 } });
  }
  const data = await svc.aggregateStats(mosqueId);
  res.json({ success: true, data });
});

const impact = tryOrNext(async (req, res) => {
  const mosqueId = await svc.resolveMosqueId(req.query.mosqueId);
  if (!mosqueId) {
    return res.json({ success: true, data: { prayersTracked: 0, studentsTaught: 0, nikahHosted: 0, familiesSupported: 0 } });
  }
  const data = await svc.aggregateImpact(mosqueId);
  res.json({ success: true, data });
});

const featured = tryOrNext(async (req, res) => {
  const mosqueId = await svc.resolveMosqueId(req.query.mosqueId);
  if (!mosqueId) return res.json({ success: true, data: null });
  const data = await svc.featuredCampaign(mosqueId);
  res.json({ success: true, data: data || null });
});

const campaigns = tryOrNext(async (req, res) => {
  const mosqueId = await svc.resolveMosqueId(req.query.mosqueId);
  if (!mosqueId) return res.json({ success: true, data: [] });
  const data = await svc.listCampaigns(mosqueId);
  res.json({ success: true, data });
});

const testimonials = tryOrNext(async (req, res) => {
  const mosqueId = await svc.resolveMosqueId(req.query.mosqueId);
  if (!mosqueId) return res.json({ success: true, data: [] });
  const data = await svc.listTestimonials(mosqueId);
  res.json({ success: true, data });
});

const heroSlides = tryOrNext(async (req, res) => {
  const mosqueId = await svc.resolveMosqueId(req.query.mosqueId);
  if (!mosqueId) return res.json({ success: true, data: [] });
  const data = await svc.listHeroSlides(mosqueId);
  res.json({ success: true, data });
});

module.exports = { stats, impact, featured, campaigns, testimonials, heroSlides };