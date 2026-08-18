const NikahBooking = require('../models/NikahBooking');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function todayMidnight() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function dayBounds(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function listForCaller(user) {
  let query = {};
  if (user.role === 'community') query.userId = user._id;
  if (user.role === 'scholar') {
    query = {
      mosqueId: user.mosqueId,
      $or: [{ scholarId: user._id }, { status: 'pending' }],
    };
  }
  if (user.role === 'admin') query.mosqueId = user.mosqueId;
  return NikahBooking.find(query)
    .populate('scholarId', 'name email')
    .sort({ createdAt: -1 });
}

async function slotTaken({ mosqueId, date, time, excludeId }) {
  const { start, end } = dayBounds(date);
  const conflict = await NikahBooking.findOne({
    mosqueId,
    status: 'accepted',
    _id: excludeId ? { $ne: excludeId } : { $exists: true },
    $or: [
      { preferredDate: { $gte: start, $lt: end }, preferredTime: time },
      { confirmedDate: { $gte: start, $lt: end }, confirmedTime: time },
    ],
  });
  return !!conflict;
}

async function createBooking(input, user) {
  if (!user.mosqueId) throw httpError(400, 'No mosque assigned to user');

  const preferredDayStart = new Date(input.preferredDate);
  preferredDayStart.setHours(0, 0, 0, 0);
  if (preferredDayStart < todayMidnight()) {
    throw httpError(400, 'Preferred date cannot be in the past');
  }

  if (await slotTaken({ mosqueId: user.mosqueId, date: input.preferredDate, time: input.preferredTime })) {
    throw httpError(409, 'Selected Nikah slot is already taken');
  }

  return NikahBooking.create({
    ...input,
    groomName: sanitizeString(input.groomName),
    brideName: sanitizeString(input.brideName),
    contact: sanitizeString(input.contact),
    preferredTime: sanitizeString(input.preferredTime),
    rejectionReason: undefined,
    userId: user._id,
    mosqueId: user.mosqueId,
    preferredDate: new Date(input.preferredDate),
    status: 'pending',
  });
}

async function reviewBooking(id, input, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid booking id');

  const booking = await NikahBooking.findById(id);
  if (!booking) throw httpError(404, 'Booking not found');

  if (String(booking.mosqueId) !== String(user.mosqueId)) {
    throw httpError(403, 'Not authorized for this mosque booking');
  }
  if (user.role === 'scholar' && booking.scholarId && String(booking.scholarId) !== String(user._id)) {
    throw httpError(403, 'Booking belongs to another scholar');
  }
  if (booking.status !== 'pending') {
    throw httpError(409, `Booking is already ${booking.status}`);
  }

  const update = { status: input.status };

  if (input.status === 'accepted') {
    const selectedDate = new Date(input.confirmedDate || booking.preferredDate);
    const selectedDayStart = new Date(selectedDate);
    selectedDayStart.setHours(0, 0, 0, 0);
    if (selectedDayStart < todayMidnight()) {
      throw httpError(400, 'Confirmed date cannot be in the past');
    }
    const selectedTime = sanitizeString(input.confirmedTime || booking.preferredTime);
    if (await slotTaken({
      mosqueId: booking.mosqueId,
      date: selectedDate,
      time: selectedTime,
      excludeId: booking._id,
    })) {
      throw httpError(409, 'Selected Nikah slot is already taken');
    }
    update.scholarId = user._id;
    update.confirmedDate = selectedDate;
    update.confirmedTime = selectedTime;
    update.rejectionReason = undefined;
  }
  if (input.status === 'rejected') {
    update.rejectionReason = sanitizeString(input.rejectionReason || 'Not available at requested slot');
  }

  return NikahBooking.findByIdAndUpdate(id, update, { new: true });
}

module.exports = { listForCaller, createBooking, reviewBooking };
