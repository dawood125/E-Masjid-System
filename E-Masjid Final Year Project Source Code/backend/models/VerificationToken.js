const mongoose = require('mongoose');
const crypto = require('crypto');

const CODE_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const verificationTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, unique: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  lastSentAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
}, { timestamps: true });

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

verificationTokenSchema.statics.hashCode = function (code) {
  return crypto.createHash('sha256').update(code).digest('hex');
};

verificationTokenSchema.statics.generateCode = function () {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
};

verificationTokenSchema.statics.CODE_TTL_MS = CODE_TTL_MS;
verificationTokenSchema.statics.VERIFIED_TTL_MS = VERIFIED_TTL_MS;
verificationTokenSchema.statics.RESEND_COOLDOWN_MS = RESEND_COOLDOWN_MS;
verificationTokenSchema.statics.MAX_ATTEMPTS = MAX_ATTEMPTS;

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
