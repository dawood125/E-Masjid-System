const mongoose = require('mongoose');
const crypto = require('crypto');
const stripeLib = require('stripe');
const Donation = require('../models/Donation');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

const ALLOWED_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

function parseStatusFilter(raw, defaultValue = 'completed') {
  if (raw === undefined || raw === null || raw === '') return defaultValue;
  const v = String(raw).toLowerCase();
  if (!ALLOWED_STATUSES.includes(v)) {
    throw httpError(400, `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
  }
  return v;
}

function hasRealStripeKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return false;
  if (key.includes('your_test_key_here')) return false;
  return true;
}

function onlineAvailable() {
  return { onlineAvailable: hasRealStripeKey() };
}

function toObjectId(id) {
  return mongoose.Types.ObjectId.createFromHexString(id);
}

function maskAnonymous(donation) {
  const obj = typeof donation.toObject === 'function' ? donation.toObject() : { ...donation };
  if (obj.isAnonymous) {
    obj.donorName = 'Anonymous';
    obj.email = '';
    obj.phone = '';
  }
  return obj;
}

function monthIndex(month) {
  if (!month || month === 'all') return null;
  const lower = String(month).toLowerCase();
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const idx = monthNames.indexOf(lower);
  if (idx === -1) throw httpError(400, "Invalid month format. Use full English month name like 'august'.");
  return idx + 1;
}

async function listAdmin(query, user) {
  const { type, month, page = 1, limit = 10, mosqueId, isAnonymous, status } = query;
  const filter = {};
  if (user.role === 'manager') {
    const Mosque = require('../models/Mosque');
    if (mosqueId) {
      if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
      const owned = await Mosque.findOne({ _id: mosqueId, managerId: user._id }).select('_id');
      if (!owned) throw httpError(403, 'You do not manage this masjid');
      filter.mosqueId = mosqueId;
    } else {
      const managed = await Mosque.find({ managerId: user._id }).select('_id');
      const ids = managed.map((m) => m._id);
      if (!ids.length) return { data: [], total: 0, page: 1, totalPages: 0 };
      filter.mosqueId = { $in: ids };
    }
  } else {
    if (!user.mosqueId) throw httpError(400, 'Your account is not assigned to a mosque');
    if (mosqueId && String(mosqueId) !== String(user.mosqueId)) {
      throw httpError(403, 'Cannot view donations for a different mosque');
    }
    filter.mosqueId = user.mosqueId;
  }
  filter.status = parseStatusFilter(status, 'completed');
  if (type && type !== 'all') filter.type = new RegExp(type, 'i');
  if (month && month !== 'all') {
    filter.$expr = { $eq: [{ $month: '$createdAt' }, monthIndex(month)] };
  }
  if (isAnonymous === 'true') filter.isAnonymous = true;
  else if (isAnonymous === 'false') filter.isAnonymous = false;
  const total = await Donation.countDocuments(filter);
  const donations = await Donation.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  return {
    data: donations,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

async function listPublic({ type, month, page = 1, limit = 10, mosqueId, status }) {
  const query = {};
  if (mosqueId) {
    if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
    query.mosqueId = mosqueId;
  }
  query.status = parseStatusFilter(status, 'completed');
  if (type && type !== 'all') query.type = new RegExp(type, 'i');
  if (month && month !== 'all') {
    query.$expr = { $eq: [{ $month: '$createdAt' }, monthIndex(month)] };
  }

  const total = await Donation.countDocuments(query);
  const donations = await Donation.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  return {
    data: donations.map(maskAnonymous),
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

async function aggregateTopDonors({ mosqueId }) {
  if (mosqueId && !isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
  const match = {
    isAnonymous: false,
    status: 'completed',
    ...(mosqueId ? { mosqueId: toObjectId(mosqueId) } : {}),
  };
  const rows = await Donation.aggregate([
    { $match: match },
    { $group: { _id: '$donorName', totalAmount: { $sum: '$amount' }, donationCount: { $sum: 1 } } },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 },
    { $project: { name: '$_id', totalAmount: 1, donationCount: 1, _id: 0 } },
  ]);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

async function aggregateSummary({ mosqueId }) {
  if (mosqueId && !isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
  const match = { status: 'completed', ...(mosqueId ? { mosqueId: toObjectId(mosqueId) } : {}) };
  const totals = await Donation.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const byType = await Donation.aggregate([
    { $match: match },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthly = await Donation.aggregate([
    { $match: { ...match, createdAt: { $gte: startOfLastMonth } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' } } },
  ]);
  const monthlyMap = monthly.reduce((acc, item) => {
    acc[item._id] = item.total;
    return acc;
  }, {});
  const thisMonthKey = `${startOfThisMonth.getFullYear()}-${String(startOfThisMonth.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthKey = `${startOfLastMonth.getFullYear()}-${String(startOfLastMonth.getMonth() + 1).padStart(2, '0')}`;
  return {
    totalDonations: totals[0]?.total || 0,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {}),
    thisMonth: monthlyMap[thisMonthKey] || 0,
    lastMonth: monthlyMap[lastMonthKey] || 0,
  };
}

async function findByStripeSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') throw httpError(400, 'Invalid session id');
  const donation = await Donation.findOne({ stripeSessionId: sessionId })
    .select('donorName amount type paymentMethod isAnonymous stripeSessionId stripePaymentId status createdAt mosqueId')
    .lean();
  if (!donation) throw httpError(404, 'Donation not found yet');
  if (donation.status === 'pending') {
    const reconciled = await reconcilePendingWithStripe(sessionId, donation);
    if (reconciled) return reconciled;
  }
  return donation;
}

async function reconcilePendingWithStripe(sessionId, donation) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_test_key_here')) {
    return null;
  }
  let session;
  try {
    const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.warn(`[donationsService] stripe retrieve failed for ${sessionId}: ${err.message}`);
    return null;
  }
  if (!session) return null;
  const isPaid = session.payment_status === 'paid' && session.status === 'complete';
  if (!isPaid) return null;
  const updates = {
    status: 'completed',
    stripeSessionId: session.id,
  };
  if (session.payment_intent) updates.stripePaymentId = session.payment_intent;
  if (typeof session.amount_total === 'number' && Number.isFinite(session.amount_total)) {
    updates.amount = session.amount_total / 100;
  }
  const updated = await Donation.findByIdAndUpdate(
    donation._id,
    { $set: updates },
    { new: true }
  )
    .select('donorName amount type paymentMethod isAnonymous stripeSessionId stripePaymentId status createdAt mosqueId')
    .lean();
  return updated || donation;
}

async function createCash(input, user) {
  if (input.mosqueId && user.mosqueId && String(input.mosqueId) !== String(user.mosqueId)) {
    throw httpError(403, 'Cannot create donations for a different mosque');
  }
  if (user.role !== 'manager' && !user.mosqueId) {
    throw httpError(400, 'Your account is not assigned to a mosque');
  }
  return Donation.create({
    ...input,
    donorName: sanitizeString(input.donorName),
    mosqueId: user.mosqueId,
  });
}

async function createStripeCheckout(input) {
  const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
  const idempotencyKey = `donation_${crypto.randomBytes(12).toString('hex')}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    client_reference_id: idempotencyKey,
    ...(input.email ? { customer_email: sanitizeString(input.email) } : {}),
    line_items: [
      {
        price_data: {
          currency: 'pkr',
          product_data: {
            name: `Donation (${input.type || 'Masjid Fund'})`,
            description: 'E-Masjid Online Donation',
          },
          unit_amount: Math.round(Number(input.amount) * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL}/donate?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/donate?canceled=1`,
    metadata: {
      idempotencyKey,
      donorName: sanitizeString(input.donorName || 'Online Donor'),
      email: sanitizeString(input.email || ''),
      phone: sanitizeString(input.phone || ''),
      amount: String(input.amount),
      type: input.type || 'Masjid Fund',
      isAnonymous: String(!!input.isAnonymous),
      mosqueId: input.mosqueId || '',
    },
  }, { idempotencyKey });

  const pendingDonation = await Donation.create({
    donorName: sanitizeString(input.donorName || 'Online Donor'),
    email: sanitizeString(input.email || ''),
    phone: sanitizeString(input.phone || ''),
    amount: Number(input.amount),
    type: input.type || 'Masjid Fund',
    paymentMethod: 'Online',
    isAnonymous: !!input.isAnonymous,
    status: 'pending',
    stripeSessionId: session.id,
    mosqueId: input.mosqueId || undefined,
    note: input.note || undefined,
  });

  return { url: session.url, donationId: pendingDonation._id };
}

async function createOnlineDonation(input) {
  if (!input.amount || input.amount < 100) {
    throw httpError(400, 'Minimum donation amount is PKR 100');
  }
  if (!hasRealStripeKey()) {
    throw httpError(503, 'Online donations are temporarily unavailable. Please contact the masjid office to donate.');
  }
  return createStripeCheckout(input);
}

async function update(id, body, user) {
  const donation = await Donation.findOneAndUpdate(
    { _id: id, mosqueId: user.mosqueId },
    body,
    { new: true, runValidators: true }
  );
  if (!donation) throw httpError(404, 'Donation not found');
  return donation;
}

async function remove(id, user) {
  const donation = await Donation.findOneAndDelete({ _id: id, mosqueId: user.mosqueId });
  if (!donation) throw httpError(404, 'Donation not found');
  return donation;
}

module.exports = {
  listPublic,
  listAdmin,
  aggregateTopDonors,
  aggregateSummary,
  findByStripeSession,
  createCash,
  createOnlineDonation,
  onlineAvailable,
  update,
  remove,
};
