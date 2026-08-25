const crypto = require('crypto');
const User = require('../models/User');
const Mosque = require('../models/Mosque');
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
  const taken = await User.findOne({ email: email.toLowerCase() });
  if (taken) throw httpError(400, 'User already exists with this email');

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: 'community',
    ...(address ? { address } : {}),
    ...(city ? { city } : {}),
    ...(mosqueId ? { mosqueId } : {}),
  });
  return { user, token: tokenForUser(user) };
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

module.exports = {
  PASSWORD_REGEX,
  findActiveMosqueForRegistration,
  registerUser,
  loginUser,
  requestPasswordReset,
  consumePasswordReset,
};
