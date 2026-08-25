const mongoose = require('mongoose');

/**
 * Hero Slide model.
 *
 * The homepage hero can show a sequence of slides (rotating). The
 * default 6 images from Gemini Pro are stored in /public/assets/images/hero/
 * and the admin can change which of those (or any new ones) are shown
 * by setting isActive=true on those records and ordering them with `order`.
 */
const heroSlideSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'Image URL/path is required'],
  },
  mobileImage: { type: String }, // Optional 9:16 mobile crop
  caption: {
    type: String,
    trim: true,
    maxlength: [140, 'Caption must be 140 characters or fewer'],
  },
  link: { type: String, trim: true }, // Optional CTA link
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  mosqueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mosque',
    required: true,
    index: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

heroSlideSchema.index({ isActive: 1, order: 1 });
heroSlideSchema.index({ mosqueId: 1, isActive: 1, order: 1 });

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
