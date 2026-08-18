const Campaign = require('../models/Campaign');
const Testimonial = require('../models/Testimonial');
const HeroSlide = require('../models/HeroSlide');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

async function listCampaigns() {
  return Campaign.find({}).sort({ order: 1, createdAt: -1 }).lean({ virtuals: true });
}

function sanitizeCampaign(body) {
  const data = { ...body };
  if (data.title) data.title = sanitizeString(data.title);
  if (data.subtitle) data.subtitle = sanitizeString(data.subtitle);
  if (data.image) data.image = sanitizeString(data.image);
  return data;
}

async function createCampaign(body, user) {
  const data = { ...sanitizeCampaign(body), createdBy: user._id };
  const campaign = await Campaign.create(data);
  return campaign.toJSON({ virtuals: true });
}

async function updateCampaign(id, body) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid campaign id');
  const campaign = await Campaign.findByIdAndUpdate(id, sanitizeCampaign(body), { new: true });
  if (!campaign) throw httpError(404, 'Campaign not found');
  return campaign.toJSON({ virtuals: true });
}

async function deleteCampaign(id) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid campaign id');
  const campaign = await Campaign.findByIdAndDelete(id);
  if (!campaign) throw httpError(404, 'Campaign not found');
  return campaign;
}

async function listTestimonials() {
  return Testimonial.find({}).sort({ order: 1, createdAt: -1 });
}

function sanitizeTestimonial(body) {
  const data = { ...body };
  if (data.name) data.name = sanitizeString(data.name);
  if (data.role) data.role = sanitizeString(data.role);
  if (data.quote) data.quote = sanitizeString(data.quote);
  if (data.photo) data.photo = sanitizeString(data.photo);
  return data;
}

async function createTestimonial(body, user) {
  const data = { ...sanitizeTestimonial(body), createdBy: user._id };
  return Testimonial.create(data);
}

async function updateTestimonial(id, body) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid testimonial id');
  const updated = await Testimonial.findByIdAndUpdate(id, sanitizeTestimonial(body), { new: true });
  if (!updated) throw httpError(404, 'Testimonial not found');
  return updated;
}

async function deleteTestimonial(id) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid testimonial id');
  const deleted = await Testimonial.findByIdAndDelete(id);
  if (!deleted) throw httpError(404, 'Testimonial not found');
  return deleted;
}

async function listHeroSlides() {
  return HeroSlide.find({}).sort({ order: 1, createdAt: 1 });
}

function sanitizeHeroSlide(body) {
  const data = { ...body };
  if (data.image) data.image = sanitizeString(data.image);
  if (data.mobileImage) data.mobileImage = sanitizeString(data.mobileImage);
  if (data.caption) data.caption = sanitizeString(data.caption);
  if (data.link) data.link = sanitizeString(data.link);
  return data;
}

async function createHeroSlide(body, user) {
  const data = { ...sanitizeHeroSlide(body), createdBy: user._id };
  return HeroSlide.create(data);
}

async function updateHeroSlide(id, body) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid hero slide id');
  const updated = await HeroSlide.findByIdAndUpdate(id, sanitizeHeroSlide(body), { new: true });
  if (!updated) throw httpError(404, 'Hero slide not found');
  return updated;
}

async function deleteHeroSlide(id) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid hero slide id');
  const deleted = await HeroSlide.findByIdAndDelete(id);
  if (!deleted) throw httpError(404, 'Hero slide not found');
  return deleted;
}

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
