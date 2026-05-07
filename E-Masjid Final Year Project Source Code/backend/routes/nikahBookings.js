const express = require('express');
const router = express.Router();
const NikahBooking = require('../models/NikahBooking');
const { protect, authorize } = require('../middleware/auth');

// GET /api/nikah-bookings - Get bookings
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'community') query.userId = req.user._id;
    if (req.user.role === 'scholar') query.scholarId = req.user._id;

    const bookings = await NikahBooking.find(query)
      .populate('scholarId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) { next(error); }
});

// POST /api/nikah-bookings - Create booking
router.post('/', protect, async (req, res, next) => {
  try {
    const booking = await NikahBooking.create({
      ...req.body,
      userId: req.user._id,
      mosqueId: req.user.mosqueId,
      status: 'pending',
    });
    res.status(201).json({ success: true, data: booking });
  } catch (error) { next(error); }
});

// PUT /api/nikah-bookings/:id - Scholar accept/reject
router.put('/:id', protect, authorize('scholar', 'admin'), async (req, res, next) => {
  try {
    const { status, confirmedDate, confirmedTime, rejectionReason } = req.body;
    const update = { status };

    if (status === 'accepted') {
      update.scholarId = req.user._id;
      update.confirmedDate = confirmedDate;
      update.confirmedTime = confirmedTime;
    }
    if (status === 'rejected') {
      update.rejectionReason = rejectionReason;
    }

    const booking = await NikahBooking.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    res.json({ success: true, data: booking });
  } catch (error) { next(error); }
});

module.exports = router;
