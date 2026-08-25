const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1h',
  });
};

const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  try {
    return { decoded: jwt.verify(token, process.env.JWT_SECRET), source: 'primary' };
  } catch (primaryErr) {
    const oldSecret = process.env.JWT_SECRET_OLD;
    if (oldSecret) {
      try {
        return { decoded: jwt.verify(token, oldSecret), source: 'legacy' };
      } catch (legacyErr) {
        throw primaryErr;
      }
    }
    throw primaryErr;
  }
};

module.exports = generateToken;
module.exports.verifyToken = verifyToken;