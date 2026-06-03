const mongoose = require('mongoose');

const mosqueSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Mosque name is required'], trim: true },
  address: { type: String },
  city: { type: String, required: [true, 'City is required'] },
  phone: { type: String },
  email: { type: String },
  image: { type: String },
  enabledModules: {
    type: [String],
    enum: ['donations', 'expenses', 'events', 'nikah', 'announcements', 'prayerTimes', 'fundRequests'],
    default: ['prayerTimes', 'announcements'],
  },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

mosqueSchema.index({ managerId: 1, createdAt: -1 });
mosqueSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Mosque', mosqueSchema);
