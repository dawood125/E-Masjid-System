const mongoose = require('mongoose');

const prayerTimeSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  fajr: { type: String, required: true },
  zuhr: { type: String, required: true },
  asr: { type: String, required: true },
  maghrib: { type: String, required: true },
  isha: { type: String, required: true },
  jummah: { type: String },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
}, { timestamps: true });

prayerTimeSchema.index({ date: 1, mosqueId: 1 }, { unique: true });

module.exports = mongoose.model('PrayerTime', prayerTimeSchema);
