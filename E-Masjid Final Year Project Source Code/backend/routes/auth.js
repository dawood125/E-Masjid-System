const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { protect } = require('../middleware/auth');
const { handleValidation, isValidObjectId } = require('../middleware/validate');
const authController = require('../controllers/authController');
const { PASSWORD_REGEX, findActiveMosqueForRegistration } = require('../services/authService');

const passwordRule = body('password')
  .isString()
  .matches(PASSWORD_REGEX)
  .withMessage('Password must be at least 8 characters and include at least one letter and one number');

router.post('/register', [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  passwordRule,
  body('phone').optional().isString().trim().isLength({ min: 7, max: 20 }).withMessage('Phone must be between 7 and 20 characters'),
  handleValidation,
], async (req, res, next) => {
  try {
    if (req.body.mosqueId) {
      if (!isValidObjectId(req.body.mosqueId)) {
        return res.status(400).json({ success: false, message: 'Invalid mosque id' });
      }
      await findActiveMosqueForRegistration(req.body.mosqueId);
    }
    return authController.register(req, res, next);
  } catch (e) { next(e); }
});

router.post('/login', [
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  body('password').isString().isLength({ min: 1 }).withMessage('Password is required'),
  handleValidation,
], authController.login);

router.post('/forgot-password', [
  body('email').isString().trim().isEmail().withMessage('Valid email is required'),
  handleValidation,
], authController.forgotPassword);

router.post('/reset-password/:token', [
  param('token').isString().isLength({ min: 20, max: 128 }).withMessage('Invalid token'),
  passwordRule,
  body('confirmPassword').optional().isString().custom((value, { req }) => {
    if (value !== undefined && value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  handleValidation,
], authController.resetPassword);

router.get('/me', protect, authController.getMe);

router.put('/me/mosque', [
  protect,
  body('mosqueId').isString().notEmpty().withMessage('Mosque id is required'),
  handleValidation,
], async (req, res, next) => {
  try {
    if (!isValidObjectId(req.body.mosqueId)) {
      return res.status(400).json({ success: false, message: 'Invalid mosque id' });
    }
    return authController.updateMyMosque(req, res, next);
  } catch (e) { next(e); }
});

router.post('/refresh-token', protect, authController.refreshToken);

router.post('/logout', authController.logout);

module.exports = router;
