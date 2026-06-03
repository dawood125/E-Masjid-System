const mongoose = require('mongoose');

const fundRequestSchema = new mongoose.Schema({
  requesterName: { type: String, required: [true, 'Name is required'] },
  requesterEmail: { type: String, required: [true, 'Email is required'] },
  requesterPhone: { type: String, required: [true, 'Phone is required'] },
  amount: { type: Number, required: [true, 'Amount is required'], min: 1 },
  reason: { type: String, required: [true, 'Reason is required'], minlength: 30 },
  category: {
    type: String,
    enum: ['Medical', 'Education', 'Housing', 'Food', 'Clothing', 'Debt', 'Other'],
    required: true,
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
}, { timestamps: true });

fundRequestSchema.index({ mosqueId: 1, status: 1, createdAt: -1 });
fundRequestSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FundRequest', fundRequestSchema);
