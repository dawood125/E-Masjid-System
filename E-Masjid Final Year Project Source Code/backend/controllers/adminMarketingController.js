const svc = require('../services/adminMarketingService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listCampaigns = tryOrNext(async (req, res) => {
  const data = await svc.listCampaigns();
  res.json({ success: true, data });
});

const createCampaign = tryOrNext(async (req, res) => {
  const data = await svc.createCampaign(req.body, req.user);
  res.status(201).json({ success: true, data });
});

const updateCampaign = tryOrNext(async (req, res) => {
  const data = await svc.updateCampaign(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteCampaign = tryOrNext(async (req, res) => {
  await svc.deleteCampaign(req.params.id);
  res.json({ success: true, message: 'Campaign deleted' });
});

const listTestimonials = tryOrNext(async (req, res) => {
  const data = await svc.listTestimonials();
  res.json({ success: true, data });
});

const createTestimonial = tryOrNext(async (req, res) => {
  const data = await svc.createTestimonial(req.body, req.user);
  res.status(201).json({ success: true, data });
});

const updateTestimonial = tryOrNext(async (req, res) => {
  const data = await svc.updateTestimonial(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteTestimonial = tryOrNext(async (req, res) => {
  await svc.deleteTestimonial(req.params.id);
  res.json({ success: true, message: 'Testimonial deleted' });
});

const listHeroSlides = tryOrNext(async (req, res) => {
  const data = await svc.listHeroSlides();
  res.json({ success: true, data });
});

const createHeroSlide = tryOrNext(async (req, res) => {
  const data = await svc.createHeroSlide(req.body, req.user);
  res.status(201).json({ success: true, data });
});

const updateHeroSlide = tryOrNext(async (req, res) => {
  const data = await svc.updateHeroSlide(req.params.id, req.body);
  res.json({ success: true, data });
});

const deleteHeroSlide = tryOrNext(async (req, res) => {
  await svc.deleteHeroSlide(req.params.id);
  res.json({ success: true, message: 'Hero slide deleted' });
});

module.exports = {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  listHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
};
