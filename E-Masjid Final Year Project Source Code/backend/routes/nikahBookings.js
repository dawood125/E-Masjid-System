const express = require('express');
const router = express.Router();
const NikahBooking = require('../models/NikahBooking');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation, isValidObjectId, sanitizeString } = require('../middleware/validate');

// GET /api/nikah-bookings - Get bookings
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'community') query.userId = req.user._id;
    if (req.user.role === 'scholar') {
      query = {
        mosqueId: req.user.mosqueId,
        $or: [
          { scholarId: req.user._id },
          { status: 'pending' },
        ],
      };
    }
    if (req.user.role === 'admin') query.mosqueId = req.user.mosqueId;

    const bookings = await NikahBooking.find(query)
      .populate('scholarId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) { next(error); }
});

// POST /api/nikah-bookings - Create booking
router.post(
  '/',
  protect,
  [
    body('groomName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Groom name is required'),
    body('brideName').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Bride name is required'),
    body('preferredDate').isISO8601().withMessage('Valid preferredDate is required'),
    body('preferredTime').isString().trim().isLength({ min: 3, max: 20 }).withMessage('Valid preferredTime is required'),
    body('contact').isString().trim().isLength({ min: 7, max: 40 }).withMessage('Valid contact is required'),
    body('notes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    if (!req.user.mosqueId) {
      return res.status(400).json({ success: false, message: 'No mosque assigned to user' });
    }

    const preferredDate = new Date(req.body.preferredDate);
    const now = new Date();
    const nowDayStart = new Date(now);
    nowDayStart.setHours(0, 0, 0, 0);
    const preferredDayStart = new Date(preferredDate);
    preferredDayStart.setHours(0, 0, 0, 0);
    if (preferredDayStart < nowDayStart) {
      return res.status(400).json({ success: false, message: 'Preferred date cannot be in the past' });
    }

    const dayStart = new Date(preferredDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const conflict = await NikahBooking.findOne({
      mosqueId: req.user.mosqueId,
      status: 'accepted',
      $or: [
        { preferredDate: { $gte: dayStart, $lt: dayEnd }, preferredTime: req.body.preferredTime },
        { confirmedDate: { $gte: dayStart, $lt: dayEnd }, confirmedTime: req.body.preferredTime },
      ],
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'Selected Nikah slot is already taken' });
    }

    const booking = await NikahBooking.create({
      ...req.body,
      groomName: sanitizeString(req.body.groomName),
      brideName: sanitizeString(req.body.brideName),
      contact: sanitizeString(req.body.contact),
      preferredTime: sanitizeString(req.body.preferredTime),
      rejectionReason: undefined,
      userId: req.user._id,
      mosqueId: req.user.mosqueId,
      preferredDate,
      status: 'pending',
    });
    res.status(201).json({ success: true, data: booking });
  } catch (error) { next(error); }
});

// PUT /api/nikah-bookings/:id - Scholar accept/reject
router.put(
  '/:id',
  protect,
  authorize('scholar', 'admin'),
  [
    body('status').isIn(['accepted', 'rejected']).withMessage('Status must be accepted or rejected'),
    body('confirmedDate').optional().isISO8601().withMessage('confirmedDate must be valid date'),
    body('confirmedTime').optional().isString().trim().isLength({ min: 3, max: 20 }).withMessage('Invalid confirmedTime'),
    body('rejectionReason').optional().isString().trim().isLength({ min: 3, max: 500 }).withMessage('Invalid rejectionReason'),
    handleValidation,
  ],
  async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }
    const { status, confirmedDate, confirmedTime, rejectionReason } = req.body;
    const booking = await NikahBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (String(booking.mosqueId) !== String(req.user.mosqueId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this mosque booking' });
    }
    if (req.user.role === 'scholar' && booking.scholarId && String(booking.scholarId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Booking belongs to another scholar' });
    }
    if (booking.status !== 'pending') {
      return res.status(409).json({ success: false, message: `Booking is already ${booking.status}` });
    }

    const update = { status };

    if (status === 'accepted') {
      const selectedDate = new Date(confirmedDate || booking.preferredDate);
      const selectedDayStart = new Date(selectedDate);
      selectedDayStart.setHours(0, 0, 0, 0);
      const currentDayStart = new Date();
      currentDayStart.setHours(0, 0, 0, 0);
      if (selectedDayStart < currentDayStart) {
        return res.status(400).json({ success: false, message: 'Confirmed date cannot be in the past' });
      }
      const selectedTime = sanitizeString(confirmedTime || booking.preferredTime);
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const conflict = await NikahBooking.findOne({
        _id: { $ne: booking._id },
        mosqueId: booking.mosqueId,
        status: 'accepted',
        $or: [
          { preferredDate: { $gte: dayStart, $lt: dayEnd }, preferredTime: selectedTime },
          { confirmedDate: { $gte: dayStart, $lt: dayEnd }, confirmedTime: selectedTime },
        ],
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: 'Selected Nikah slot is already taken' });
      }

      update.scholarId = req.user._id;
      update.confirmedDate = selectedDate;
      update.confirmedTime = selectedTime;
      update.rejectionReason = undefined;
    }
    if (status === 'rejected') {
      update.rejectionReason = sanitizeString(rejectionReason || 'Not available at requested slot');
    }

    const updated = await NikahBooking.findByIdAndUpdate(req.params.id, update, { new: true });

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

module.exports = router;
