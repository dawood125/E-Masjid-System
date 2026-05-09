const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  amount: { type: Number, required: [true, 'Amount is required'], min: 1 },
  type: { type: String, enum: ['Zakat', 'Sadaqah', 'Mosque Fund', 'Ramadan', 'Wedding'], required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Online'], default: 'Cash' },
  isAnonymous: { type: Boolean, default: false },
  stripePaymentId: { type: String },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
