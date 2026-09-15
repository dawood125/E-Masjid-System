const crypto = require('crypto');
const User = require('../models/User');
const Mosque = require('../models/Mosque');
const VerificationToken = require('../models/VerificationToken');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const RESET_TTL_MS = 24 * 60 * 60 * 1000;

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function findActiveMosqueForRegistration(id) {
  const m = await Mosque.findById(id).select('_id isActive').lean();
  if (!m || !m.isActive) throw httpError(400, 'Selected mosque is not available');
  return m;
}

function tokenForUser(user) {
  return generateToken(user._id, user.role);
}

async function registerUser({ name, email, password, phone = '', address = '', city = '', mosqueId = null }) {
  const lower = email.toLowerCase();

  if (process.env.SKIP_EMAIL_VERIFICATION !== '1') {
    await consumeVerifiedEmail({ email: lower });
  }

  const taken = await User.findOne({ email: lower });
  if (taken) throw httpError(400, 'User already exists with this email');

  const user = await User.create({
    name,
    email: lower,
    password,
    phone,
    role: 'community',
    ...(address ? { address } : {}),
    ...(city ? { city } : {}),
    ...(mosqueId ? { mosqueId } : {}),
  });
  return { user, token: tokenForUser(user) };
}

async function setUserMosque(userId, mosqueId) {
  const mosque = await Mosque.findById(mosqueId).select('_id isActive name city address phone email').lean();
  if (!mosque) throw httpError(404, 'Mosque not found');
  if (!mosque.isActive) throw httpError(400, 'Selected mosque is not currently active');

  const user = await User.findById(userId);
  if (!user) throw httpError(404, 'User not found');

  user.mosqueId = mosque._id;
  await user.save();

  const fresh = await User.findById(userId).select('-password').lean();
  return { user: fresh, mosque };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw httpError(401, 'Invalid credentials');

  const ok = await user.matchPassword(password);
  if (!ok) throw httpError(401, 'Invalid credentials');

  if (!user.isActive) throw httpError(403, 'Account is deactivated');

  if (user.mosqueId && ['admin', 'scholar', 'committee'].includes(user.role)) {
    const mosque = await Mosque.findById(user.mosqueId).select('isActive name');
    if (mosque && mosque.isActive === false) {
      throw httpError(403, `Your masjid (${mosque.name}) is currently deactivated. Please contact your manager.`);
    }
  }

  return { user, token: tokenForUser(user) };
}

function buildResetEmailHtml(resetUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #047857; padding: 20px; text-align: center; color: white;">
        <h1>E-Masjid System</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #047857; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't request this, please ignore.</p>
      </div>
    </div>
  `;
}

async function requestPasswordReset({ email }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return { sent: false };

  const rawToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.resetPasswordExpire = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'E-Masjid Password Reset',
      html: buildResetEmailHtml(resetUrl),
    });
  } catch (emailErr) {
    console.error('Failed to send password reset email:', emailErr.message);
  }
  return { sent: true };
}

async function consumePasswordReset({ rawToken, newPassword }) {
  const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: new Date() },
  });
  if (!user) throw httpError(400, 'Invalid or expired reset token');

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  return user;
}

function buildVerificationEmailHtml(code) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #047857; padding: 20px; text-align: center; color: white;">
        <h1>E-Masjid System</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2>Verify your email</h2>
        <p>Use this 6-digit code to finish creating your E-Masjid account:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; padding: 16px 32px; background: #047857; color: white; font-size: 32px; letter-spacing: 8px; border-radius: 8px; font-weight: bold;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
}

async function sendVerificationCode({ email }) {
  const lower = email.toLowerCase();
  const existing = await User.findOne({ email: lower }).select('_id').lean();
  if (existing) {
    return { sent: false, reason: 'already-registered' };
  }

  const now = Date.now();
  const prior = await VerificationToken.findOne({ email: lower });
  if (prior && prior.verified) {
    return { sent: true, alreadyVerified: true };
  }
  if (prior && (now - prior.lastSentAt.getTime()) < VerificationToken.RESEND_COOLDOWN_MS) {
    const waitMs = VerificationToken.RESEND_COOLDOWN_MS - (now - prior.lastSentAt.getTime());
    throw httpError(429, `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting a new code`);
  }

  const code = VerificationToken.generateCode();
  const codeHash = VerificationToken.hashCode(code);
  const expiresAt = new Date(now + VerificationToken.CODE_TTL_MS);

  await VerificationToken.findOneAndUpdate(
    { email: lower },
    {
      email: lower,
      codeHash,
      expiresAt,
      lastSentAt: new Date(now),
      attempts: 0,
      verified: false,
      verifiedAt: null,
    },
    { upsert: true, new: true }
  );

  try {
    await sendEmail({
      to: lower,
      subject: 'Your E-Masjid verification code',
      html: buildVerificationEmailHtml(code),
    });
  } catch (emailErr) {
    console.error('Failed to send verification email:', emailErr.message);
  }
  return { sent: true, cooldownSeconds: Math.ceil(VerificationToken.RESEND_COOLDOWN_MS / 1000) };
}

async function verifyEmailCode({ email, code }) {
  const lower = email.toLowerCase();
  const record = await VerificationToken.findOne({ email: lower });
  if (!record) throw httpError(400, 'No verification request found. Please request a new code');
  if (record.verified) return { verified: true, alreadyVerified: true };

  const now = Date.now();
  const verifiedFresh = record.verifiedAt && (now - record.verifiedAt.getTime()) <= VerificationToken.VERIFIED_TTL_MS;
  if (!verifiedFresh && record.expiresAt.getTime() < now) {
    await VerificationToken.deleteOne({ _id: record._id });
    throw httpError(400, 'Verification code has expired. Please request a new code');
  }
  if (record.attempts >= VerificationToken.MAX_ATTEMPTS) {
    await VerificationToken.deleteOne({ _id: record._id });
    throw httpError(400, 'Too many attempts. Please request a new code');
  }

  record.attempts += 1;
  const ok = record.codeHash === VerificationToken.hashCode(code);
  if (!ok) {
    await record.save();
    const remaining = VerificationToken.MAX_ATTEMPTS - record.attempts;
    throw httpError(400, `Invalid code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining`);
  }

  record.verified = true;
  record.verifiedAt = new Date(now);
  record.expiresAt = new Date(now + VerificationToken.VERIFIED_TTL_MS);
  await record.save();
  return { verified: true, verifiedAt: record.verifiedAt };
}

async function consumeVerifiedEmail({ email }) {
  const lower = email.toLowerCase();
  const record = await VerificationToken.findOne({ email: lower, verified: true });
  if (!record) throw httpError(400, 'Email not verified. Please verify your email first');
  if (record.verifiedAt && (Date.now() - record.verifiedAt.getTime()) > VerificationToken.VERIFIED_TTL_MS) {
    await VerificationToken.deleteOne({ _id: record._id });
    throw httpError(400, 'Verification has expired. Please verify your email again');
  }
  await VerificationToken.deleteOne({ _id: record._id });
  return { verified: true };
}

module.exports = {
  PASSWORD_REGEX,
  findActiveMosqueForRegistration,
  registerUser,
  loginUser,
  setUserMosque,
  requestPasswordReset,
  consumePasswordReset,
  sendVerificationCode,
  verifyEmailCode,
  consumeVerifiedEmail,
};
