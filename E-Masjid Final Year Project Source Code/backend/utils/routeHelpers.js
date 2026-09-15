const { protect, authorize } = require('../middleware/auth');

function requireRole(...roles) {
  return [protect, authorize(...roles)];
}

module.exports = { requireRole };
