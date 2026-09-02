const mongoose = require('mongoose');

const specialPrayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [120, 'Name must be under 120 characters'],
  },
  type: {
    type: String,
    enum: ['eid-fitr', 'eid-adha', 'shab-meraj', 'shab-barat', 'tarawih', 'janazah', 'milad-un-nabi', 'other'],
    default: 'other',
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be under 500 characters'],
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  mosqueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mosque',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

specialPrayerSchema.index({ mosqueId: 1, date: 1 });
specialPrayerSchema.index({ mosqueId: 1, isActive: 1, date: 1 });

module.exports = mongoose.model('SpecialPrayer', specialPrayerSchema);
