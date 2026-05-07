const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'] },
  description: { type: String },
  date: { type: Date, required: [true, 'Date is required'] },
  time: { type: String },
  location: { type: String },
  maxParticipants: { type: Number, default: 0 },
  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

eventSchema.virtual('registeredCount').get(function () {
  return this.registeredUsers ? this.registeredUsers.length : 0;
});

eventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
