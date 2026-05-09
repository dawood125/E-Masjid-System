const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'] },
  content: { type: String, required: [true, 'Content is required'] },
  isUrgent: { type: Boolean, default: false },
  publishedBy: { type: String },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
