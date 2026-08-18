const { sanitizeString } = require('../middleware/validate');
const authService = require('../services/authService');
const generateToken = require('../utils/generateToken');

function pickSanitized(body, fields) {
  const out = {};
  for (const f of fields) {
    if (body[f] !== undefined) out[f] = sanitizeString(body[f]);
  }
  return out;
}

function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    mosqueId: u.mosqueId ? String(u.mosqueId) : null,
  };
}

async function register(req, res, next) {
  try {
    const fields = pickSanitized(req.body, ['name', 'email', 'address', 'city', 'phone']);
    if (req.body.mosqueId) fields.mosqueId = sanitizeString(req.body.mosqueId);
    fields.password = req.body.password;
    if (fields.email) fields.email = fields.email.toLowerCase();

    const { user, token } = await authService.registerUser(fields);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (e) { next(e); }
}

async function login(req, res, next) {
  try {
    const email = sanitizeString(req.body.email).toLowerCase();
    const { password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });
    res.json({ success: true, token, user: publicUser(user) });
  } catch (e) { next(e); }
}

async function forgotPassword(req, res, next) {
  try {
    const email = sanitizeString(req.body.email).toLowerCase();
    await authService.requestPasswordReset({ email });
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (e) { next(e); }
}

async function resetPassword(req, res, next) {
  try {
    const rawToken = req.params.token;
    const { password, confirmPassword } = req.body;
    if (confirmPassword !== undefined && confirmPassword !== password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    await authService.consumePasswordReset({ rawToken, newPassword: password });
    res.json({ success: true, message: 'Password reset successful' });
  } catch (e) { next(e); }
}

function getMe(req, res) {
  res.json({ success: true, user: req.user });
}

function refreshToken(req, res) {
  const token = generateToken(req.user._id, req.user.role);
  res.json({ success: true, token });
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
};
