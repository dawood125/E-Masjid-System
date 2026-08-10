const mongoose = require('mongoose');

const prayerTimeSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  fajr: { type: String, required: true },
  zuhr: { type: String, required: true },
  asr: { type: String, required: true },
  maghrib: { type: String, required: true },
  isha: { type: String, required: true },
  jummah: { type: String },
  eidUlFitr: { type: String },
  eidUlAdha: { type: String },
  // Phase 5 fix BUG-PRAYER-006/007: per-mosque, per-date sunrise time.
  // The admin sets this manually; if not set, the public page omits the Sunrise
  // column gracefully (instead of showing a fake "06:45").
  sunrise: { type: String },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
}, { timestamps: true });

prayerTimeSchema.index({ date: 1, mosqueId: 1 }, { unique: true });

module.exports = mongoose.model('PrayerTime', prayerTimeSchema);