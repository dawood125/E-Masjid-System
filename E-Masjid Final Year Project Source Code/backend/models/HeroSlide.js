const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'Image URL/path is required'],
  },
  mobileImage: { type: String }, 
  caption: {
    type: String,
    trim: true,
    maxlength: [140, 'Caption must be 140 characters or fewer'],
  },
  link: { type: String, trim: true }, 
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
