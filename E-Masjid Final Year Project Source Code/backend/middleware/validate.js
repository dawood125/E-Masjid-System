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

module.exports = {
  handleValidation,
  isValidObjectId,
  sanitizeString,
};
