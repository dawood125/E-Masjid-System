const { sanitizeString } = require('../middleware/validate');
const authService = require('../services/authService');
const generateToken = require('../utils/generateToken');

const TOKEN_COOKIE_NAME = 'emasjid_token';
const TOKEN_COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000;

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

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
    maxAge: TOKEN_COOKIE_MAX_AGE_MS,
  };
}

function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE_NAME, token, cookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(TOKEN_COOKIE_NAME, { path: '/' });
}

async function register(req, res, next) {
  try {
    const fields = pickSanitized(req.body, ['name', 'email', 'address', 'city', 'phone']);
    if (req.body.mosqueId) fields.mosqueId = sanitizeString(req.body.mosqueId);
    fields.password = req.body.password;
    if (fields.email) fields.email = fields.email.toLowerCase();

    const { user, token } = await authService.registerUser(fields);
    setAuthCookie(res, token);
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
    setAuthCookie(res, token);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (e) { next(e); }
}

async function logout(req, res) {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out' });
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

async function updateMyMosque(req, res, next) {
  try {
    const { user, mosque } = await authService.setUserMosque(req.user._id, req.body.mosqueId);
    res.json({
      success: true,
      user: publicUser(user),
      mosque: {
        _id: mosque._id,
        name: mosque.name,
        city: mosque.city,
        address: mosque.address || '',
        phone: mosque.phone || '',
        email: mosque.email || '',
      },
    });
  } catch (e) { next(e); }
}

function refreshToken(req, res) {
  const token = generateToken(req.user._id, req.user.role);
  setAuthCookie(res, token);
  res.json({ success: true, token });
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateMyMosque,
  refreshToken,
  TOKEN_COOKIE_NAME,
  setAuthCookie,
  clearAuthCookie,
};
