const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value.trim();
}

function normalizePakistaniMobile(value) {
  const compact = String(value || '').replace(/[\s-]/g, '');
  if (!/^(?:\+92|0092|92|0)3\d{9}$/.test(compact)) return null;
  const local = `0${compact.slice(-10)}`;
  return `${local.slice(0, 4)}-${local.slice(4)}`;
}

module.exports = {
  handleValidation,
  isValidObjectId,
  sanitizeString,
  normalizePakistaniMobile,
};
