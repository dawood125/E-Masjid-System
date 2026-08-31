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
      { ceremonyDate: { $gte: start, $lt: end }, ceremonyTime: time },
      { confirmedDate: { $gte: start, $lt: end }, confirmedTime: time },
    ],
  });
  return !!conflict;
}

async function createBooking(input, user) {
  if (!user.mosqueId) throw httpError(400, 'No mosque assigned to user');

  const ceremonyDayStart = new Date(input.ceremonyDate);
  ceremonyDayStart.setHours(0, 0, 0, 0);
  if (ceremonyDayStart < todayMidnight()) {
    throw httpError(400, 'Ceremony date cannot be in the past');
  }

  if (await slotTaken({ mosqueId: user.mosqueId, date: input.ceremonyDate, time: input.ceremonyTime })) {
    throw httpError(409, 'Selected Nikah slot is already taken');
  }

  return NikahBooking.create({
    groomName: sanitizeString(input.groomName),
    brideName: sanitizeString(input.brideName),
    phone: sanitizeString(input.phone),
    email: sanitizeString(input.email).toLowerCase(),
    address: sanitizeString(input.address),
    ceremonyDate: new Date(input.ceremonyDate),
    ceremonyTime: sanitizeString(input.ceremonyTime),
    notes: input.notes ? sanitizeString(input.notes) : undefined,
    rejectionReason: undefined,
    userId: user._id,
    mosqueId: user.mosqueId,
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
  if (booking.status !== 'pending') {
    throw httpError(409, `Booking is already ${booking.status} and cannot be reviewed`);
  }
  if (user.role === 'scholar' && booking.scholarId && String(booking.scholarId) !== String(user._id)) {
    throw httpError(403, 'Booking belongs to another scholar');
  }

  const update = { status: input.status };

  if (input.status === 'accepted') {
    const selectedDate = new Date(input.confirmedDate || booking.ceremonyDate);
    const selectedDayStart = new Date(selectedDate);
    selectedDayStart.setHours(0, 0, 0, 0);
    if (selectedDayStart < todayMidnight()) {
      throw httpError(400, 'Confirmed date cannot be in the past');
    }
    const selectedTime = sanitizeString(input.confirmedTime || booking.ceremonyTime);
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

  const updated = await NikahBooking.findOneAndUpdate(
    { _id: id, status: 'pending' },
    update,
    { new: true }
  );
  if (!updated) {
    const current = await NikahBooking.findById(id);
    throw httpError(409, `Booking is already ${current ? current.status : 'handled by another scholar'}`);
  }
  return updated;
}

async function assignScholar(id, scholarId, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid booking id');
  if (!isValidObjectId(scholarId)) throw httpError(400, 'Invalid scholarId');

  const booking = await NikahBooking.findById(id);
  if (!booking) throw httpError(404, 'Booking not found');

  if (String(booking.mosqueId) !== String(user.mosqueId)) {
    throw httpError(403, 'Not authorized for this mosque booking');
  }
  if (booking.status !== 'pending') {
    throw httpError(409, `Booking is already ${booking.status}`);
  }

  const scholar = await require('../models/User').findById(scholarId);
  if (!scholar) throw httpError(404, 'Scholar not found');
  if (scholar.role !== 'scholar') throw httpError(400, 'Assigned user is not a scholar');
  if (String(scholar.mosqueId) !== String(user.mosqueId)) {
    throw httpError(400, 'Scholar belongs to another mosque');
  }
  if (scholar.isActive === false) throw httpError(400, 'Cannot assign a deactivated scholar');

  const updated = await NikahBooking.findOneAndUpdate(
    { _id: id, status: 'pending', scholarId: { $exists: false } },
    { scholarId },
    { new: true }
  ).populate('scholarId', 'name email');
  if (!updated) {
    const current = await NikahBooking.findById(id);
    if (current && current.scholarId && String(current.scholarId) !== String(scholarId)) {
      throw httpError(409, 'Booking already assigned to another scholar');
    }
    throw httpError(409, `Booking is already ${current ? current.status : 'handled by another assignment'}`);
  }
  return updated;
}

async function availability({ user, from, to }) {
  if (!user.mosqueId) throw httpError(400, 'No mosque assigned to user');

  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw httpError(400, 'Invalid date range');
  }

  const bookings = await NikahBooking.find({
    mosqueId: user.mosqueId,
    status: 'accepted',
    $or: [
      { confirmedDate: { $gte: start, $lte: end } },
      { confirmedDate: { $exists: false }, ceremonyDate: { $gte: start, $lte: end } },
    ],
  }).populate('scholarId', 'name');

  const map = {};
  for (const booking of bookings) {
    const date = booking.confirmedDate || booking.ceremonyDate;
    const time = booking.confirmedTime || booking.ceremonyTime;
    if (!date || !time) continue;
    const dayKey = new Date(date).toISOString().slice(0, 10);
    if (!map[dayKey]) map[dayKey] = [];
    map[dayKey].push({
      time,
      scholarName: booking.scholarId && booking.scholarId.name ? booking.scholarId.name : null,
      couple: `${booking.groomName} & ${booking.brideName}`,
    });
  }
  return map;
}

async function cancelByApplicant(id, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid booking id');

  const booking = await NikahBooking.findById(id);
  if (!booking) throw httpError(404, 'Booking not found');

  if (String(booking.userId) !== String(user._id)) {
    throw httpError(403, 'You can only cancel your own bookings');
  }
  if (booking.status !== 'pending') {
    throw httpError(409, `Booking is already ${booking.status} and cannot be cancelled`);
  }

  const updated = await NikahBooking.findOneAndUpdate(
    { _id: id, status: 'pending', userId: user._id },
    {
      status: 'rejected',
      rejectionReason: 'Cancelled by applicant',
      $unset: { scholarId: '' },
    },
    { new: true }
  );
  if (!updated) {
    const current = await NikahBooking.findById(id);
    throw httpError(409, `Booking is already ${current ? current.status : 'no longer pending'} and cannot be cancelled`);
  }
  return updated;
}

module.exports = { listForCaller, createBooking, reviewBooking, assignScholar, cancelByApplicant, availability };
