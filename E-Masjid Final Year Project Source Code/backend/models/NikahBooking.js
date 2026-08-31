const mongoose = require('mongoose');

const nikahBookingSchema = new mongoose.Schema({
  groomName: { type: String, required: [true, 'Groom name is required'], trim: true },
  brideName: { type: String, required: [true, 'Bride name is required'], trim: true },
  ceremonyDate: { type: Date, required: [true, 'Ceremony date is required'] },
  ceremonyTime: { type: String, required: [true, 'Ceremony time is required'], trim: true },
  phone: { type: String, required: [true, 'Phone number is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true },
  address: { type: String, required: [true, 'Address is required'], trim: true },
  notes: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedDate: { type: Date },
  confirmedTime: { type: String },
  rejectionReason: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
}, { timestamps: true, strict: false });

nikahBookingSchema.index({ userId: 1, createdAt: -1 });
nikahBookingSchema.index({ mosqueId: 1, status: 1, ceremonyDate: 1 });
nikahBookingSchema.index({ scholarId: 1, status: 1, confirmedDate: 1 });

module.exports = mongoose.model('NikahBooking', nikahBookingSchema);
