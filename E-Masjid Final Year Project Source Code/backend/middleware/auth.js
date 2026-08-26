const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Mosque = require('../models/Mosque');
const { verifyToken } = require('../utils/generateToken');
const { TOKEN_COOKIE_NAME } = require('../controllers/authController');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies[TOKEN_COOKIE_NAME]) {
    token = req.cookies[TOKEN_COOKIE_NAME];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const { decoded } = verifyToken(token);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (req.user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact your administrator.' });
    }
    if (req.user.mosqueId && ['admin', 'scholar', 'committee'].includes(req.user.role)) {
      const mosque = await Mosque.findById(req.user.mosqueId).select('isActive name');
      if (mosque && mosque.isActive === false) {
        return res.status(403).json({ success: false, message: `Your masjid (${mosque.name}) is currently deactivated. Please contact your manager.` });
      }
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
