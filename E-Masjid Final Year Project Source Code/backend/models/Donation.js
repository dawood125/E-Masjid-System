const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] },
  phone: { type: String },
  amount: { type: Number, required: [true, 'Amount is required'], min: 1 },
  type: { type: String, enum: ['Sadaqah', 'Zakat', 'Masjid Fund'], required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Online'], default: 'Cash' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
  isAnonymous: { type: Boolean, default: false },
  note: { type: String, trim: true, maxlength: 300 },
  stripeSessionId: { type: String, unique: true, sparse: true, index: true },
  stripePaymentId: { type: String, unique: true, sparse: true },
  stripeChargeId: { type: String },
  stripeRefundId: { type: String },
  refundedAmount: { type: Number, default: 0 },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

donationSchema.index({ mosqueId: 1, createdAt: -1 });
donationSchema.index({ mosqueId: 1, type: 1, createdAt: -1 });
donationSchema.index({ isAnonymous: 1 });
donationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
