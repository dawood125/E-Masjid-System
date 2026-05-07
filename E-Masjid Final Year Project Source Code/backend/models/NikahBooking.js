const mongoose = require('mongoose');

const nikahBookingSchema = new mongoose.Schema({
  groomName: { type: String, required: true },
  brideName: { type: String, required: true },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true },
  contact: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  scholarId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedDate: { type: Date },
  confirmedTime: { type: String },
  rejectionReason: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
}, { timestamps: true });

module.exports = mongoose.model('NikahBooking', nikahBookingSchema);
