const svc = require('../services/adminMarketingService');
const { tryOrNext } = require('../utils/asyncRoute');

function pickUploadedFile(req, field, subdir) {
  if (!req.file || req.file.fieldname !== field) return undefined;
  return '/uploads/marketing/' + subdir + '/' + req.file.filename;
}

function pickUploadedFromFields(req, field, subdir) {
  const arr = req.files && req.files[field];
  if (!arr || arr.length === 0) return undefined;
  return '/uploads/marketing/' + subdir + '/' + arr[0].filename;
}

const listCampaigns = tryOrNext(async (req, res) => {
  const data = await svc.listCampaigns(req.user);
  res.json({ success: true, data });
});

const createCampaign = tryOrNext(async (req, res) => {
  const uploaded = pickUploadedFile(req, 'image', 'campaigns');
  if (uploaded) req.body.image = uploaded;
  const data = await svc.createCampaign(req.body, req.user);
  res.status(201).json({ success: true, data });
});

const updateCampaign = tryOrNext(async (req, res) => {
  const uploaded = pickUploadedFile(req, 'image', 'campaigns');
  if (uploaded) req.body.image = uploaded;
  const data = await svc.updateCampaign(req.params.id, req.body, req.user);
  res.json({ success: true, data });
});

const deleteCampaign = tryOrNext(async (req, res) => {
  await svc.deleteCampaign(req.params.id, req.user);
  res.json({ success: true, message: 'Campaign deleted' });
});

const listTestimonials = tryOrNext(async (req, res) => {
  const data = await svc.listTestimonials(req.user);
  res.json({ success: true, data });
});

const createTestimonial = tryOrNext(async (req, res) => {
  const uploaded = pickUploadedFile(req, 'photo', 'testimonials');
  if (uploaded) req.body.photo = uploaded;
  const data = await svc.createTestimonial(req.body, req.user);
  res.status(201).json({ success: true, data });
});

const updateTestimonial = tryOrNext(async (req, res) => {
  const uploaded = pickUploadedFile(req, 'photo', 'testimonials');
  if (uploaded) req.body.photo = uploaded;
  const data = await svc.updateTestimonial(req.params.id, req.body, req.user);
  res.json({ success: true, data });
});

const deleteTestimonial = tryOrNext(async (req, res) => {
  await svc.deleteTestimonial(req.params.id, req.user);
  res.json({ success: true, message: 'Testimonial deleted' });
});

const listHeroSlides = tryOrNext(async (req, res) => {
  const data = await svc.listHeroSlides(req.user);
  res.json({ success: true, data });
});

const createHeroSlide = tryOrNext(async (req, res) => {
  const image = pickUploadedFromFields(req, 'image', 'hero-slides');
  if (image) req.body.image = image;
  const mobileImage = pickUploadedFromFields(req, 'mobileImage', 'hero-slides');
  if (mobileImage) req.body.mobileImage = mobileImage;
  const data = await svc.createHeroSlide(req.body, req.user);
  res.status(201).json({ success: true, data });
});

const updateHeroSlide = tryOrNext(async (req, res) => {
  const image = pickUploadedFromFields(req, 'image', 'hero-slides');
  if (image) req.body.image = image;
  const mobileImage = pickUploadedFromFields(req, 'mobileImage', 'hero-slides');
  if (mobileImage) req.body.mobileImage = mobileImage;
  const data = await svc.updateHeroSlide(req.params.id, req.body, req.user);
  res.json({ success: true, data });
});

const deleteHeroSlide = tryOrNext(async (req, res) => {
  await svc.deleteHeroSlide(req.params.id, req.user);
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
