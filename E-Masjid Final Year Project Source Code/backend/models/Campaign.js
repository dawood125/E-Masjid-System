const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
    maxlength: [140, 'Title must be 140 characters or fewer'],
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: [400, 'Subtitle must be 400 characters or fewer'],
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0, 'Target amount must be positive'],
  },
  raisedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Raised amount cannot be negative'],
  },
  daysLeft: {
    type: Number,
    default: 30,
    min: [0, 'Days left cannot be negative'],
  },
  image: { type: String }, 
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  order: { type: Number, default: 0 }, 
  mosqueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mosque',
    required: true,
    index: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

campaignSchema.pre('save', async function (next) {
  if (this.isFeatured && this.isModified('isFeatured')) {
    await mongoose.model('Campaign').updateMany(
      { _id: { $ne: this._id }, isFeatured: true },
      { $set: { isFeatured: false } }
    );
  }
  next();
});

campaignSchema.index({ isFeatured: 1, isActive: 1 });
campaignSchema.index({ isActive: 1, order: 1, createdAt: -1 });
campaignSchema.index({ mosqueId: 1, isActive: 1, order: 1 });
campaignSchema.index({ mosqueId: 1, isFeatured: 1, isActive: 1 });

campaignSchema.virtual('progressPercent').get(function () {
  if (!this.targetAmount || this.targetAmount <= 0) return 0;
  return Math.min(Math.round((this.raisedAmount / this.targetAmount) * 100), 100);
});

campaignSchema.set('toJSON', { virtuals: true });
campaignSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Campaign', campaignSchema);
