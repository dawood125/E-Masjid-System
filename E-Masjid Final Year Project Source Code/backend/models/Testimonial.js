const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [80, 'Name must be 80 characters or fewer'],
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    maxlength: [120, 'Role must be 120 characters or fewer'],
  },
  quote: {
    type: String,
    required: [true, 'Quote is required'],
    trim: true,
    maxlength: [600, 'Quote must be 600 characters or fewer'],
  },
  photo: {
    type: String,
    default: '/assets/images/testimonials/testimonial-1.jpg',
  },
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

testimonialSchema.index({ isActive: 1, order: 1, createdAt: -1 });
testimonialSchema.index({ mosqueId: 1, isActive: 1, order: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
