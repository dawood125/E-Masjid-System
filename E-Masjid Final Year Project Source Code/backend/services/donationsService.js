const mongoose = require('mongoose');
const stripeLib = require('stripe');
const Donation = require('../models/Donation');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

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
  return new Date(`${month} 1, 2026`).getMonth() + 1;
}

async function listAdmin(query, user) {
  const { type, month, page = 1, limit = 10, mosqueId } = query;
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
  if (type && type !== 'all') filter.type = new RegExp(type, 'i');
  if (month && month !== 'all') {
    filter.$expr = { $eq: [{ $month: '$createdAt' }, monthIndex(month)] };
  }
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

async function listPublic({ type, month, page = 1, limit = 10, mosqueId }) {
  const query = {};
  if (mosqueId) {
    if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
    query.mosqueId = mosqueId;
  }
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
  const match = mosqueId ? { mosqueId: toObjectId(mosqueId) } : {};
  const totals = await Donation.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const byType = await Donation.aggregate([
    { $match: match },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  return {
    totalDonations: totals[0]?.total || 0,
    byType: byType.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {}),
  };
}

function generateTransactionId(donationId) {
  const suffix = String(donationId).slice(-5).toUpperCase();
  return `TXN-${new Date().getFullYear()}-${suffix}`;
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

async function createLegacyOnline(input) {
  const donation = await Donation.create({
    donorName: sanitizeString(input.donorName || 'Online Donor'),
    email: sanitizeString(input.email || ''),
    phone: sanitizeString(input.phone || ''),
    amount: Number(input.amount),
    type: input.type || 'Masjid Fund',
    paymentMethod: 'Online',
    isAnonymous: input.isAnonymous || false,
    mosqueId: input.mosqueId,
  });
  return {
    donation,
    transactionId: generateTransactionId(donation._id),
  };
}

async function createStripeCheckout(input) {
  const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
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
    success_url: `${process.env.CLIENT_URL}/donate?success=1`,
    cancel_url: `${process.env.CLIENT_URL}/donate?canceled=1`,
    metadata: {
      donorName: sanitizeString(input.donorName || 'Online Donor'),
      email: sanitizeString(input.email || ''),
      phone: sanitizeString(input.phone || ''),
      amount: String(input.amount),
      type: input.type || 'Masjid Fund',
      isAnonymous: String(!!input.isAnonymous),
      mosqueId: input.mosqueId || '',
    },
  });
  return { url: session.url };
}

async function createOnlineDonation(input) {
  if (!input.amount || input.amount < 100) {
    throw httpError(400, 'Minimum donation amount is PKR 100');
  }
  const noRealStripe = !process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY.includes('your_test_key_here');
  if (noRealStripe) {
    return createLegacyOnline(input);
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
  createCash,
  createOnlineDonation,
  update,
  remove,
};
