const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'] },
  content: { type: String, required: [true, 'Content is required'] },
  isUrgent: { type: Boolean, default: false },
  publishedBy: { type: String },
  publishDate: { type: Date },
  status: { type: String, enum: ['draft', 'published'], default: 'published' },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
}, { timestamps: true });

announcementSchema.index({ mosqueId: 1, createdAt: -1 });
announcementSchema.index({ mosqueId: 1, isUrgent: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
