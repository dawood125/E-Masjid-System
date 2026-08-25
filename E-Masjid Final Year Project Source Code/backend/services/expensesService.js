const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function toObjectId(id) {
  return mongoose.Types.ObjectId.createFromHexString(id);
}

function monthIndex(month) {
  if (!month || month === 'all') return null;
  const lower = String(month).toLowerCase();
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const idx = monthNames.indexOf(lower);
  if (idx === -1) throw httpError(400, "Invalid month format. Use full English month name like 'august'.");
  return idx + 1;
}

async function listPublic({ category, month, page = 1, limit = 10, mosqueId }) {
  const query = {};
  if (mosqueId) {
    if (!isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
    query.mosqueId = mosqueId;
  }
  if (category && category !== 'all') query.category = category;
  if (month && month !== 'all') {
    query.$expr = { $eq: [{ $month: '$createdAt' }, monthIndex(month)] };
  }
  const total = await Expense.countDocuments(query);
  const expenses = await Expense.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
  return {
    data: expenses,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

async function listAdmin(query, user) {
  const { category, month, page = 1, limit = 10, mosqueId } = query;
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
      throw httpError(403, 'Cannot view expenses for a different mosque');
    }
    filter.mosqueId = user.mosqueId;
  }
  if (category && category !== 'all') filter.category = category;
  if (month && month !== 'all') {
    filter.$expr = { $eq: [{ $month: '$createdAt' }, monthIndex(month)] };
  }
  const total = await Expense.countDocuments(filter);
  const expenses = await Expense.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
  return {
    data: expenses,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
}

async function aggregateSummary({ mosqueId }) {
  if (mosqueId && !isValidObjectId(mosqueId)) throw httpError(400, 'Invalid mosqueId');
  const match = mosqueId ? { mosqueId: toObjectId(mosqueId) } : {};
  const byCategory = await Expense.aggregate([
    { $match: match },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);
  const totals = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const now = new Date();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthly = await Expense.aggregate([
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
    totalExpenses: totals[0]?.total || 0,
    byCategory: byCategory.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {}),
    thisMonth: monthlyMap[thisMonthKey] || 0,
    lastMonth: monthlyMap[lastMonthKey] || 0,
  };
}

async function create(input, user) {
  return Expense.create({
    ...input,
    description: sanitizeString(input.description),
    addedBy: user._id,
    mosqueId: user.mosqueId,
  });
}

async function update(id, body, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid expense id');
  const expense = await Expense.findOneAndUpdate(
    { _id: id, mosqueId: user.mosqueId },
    {
      ...body,
      ...(body.description ? { description: sanitizeString(body.description) } : {}),
    },
    { new: true, runValidators: true }
  );
  if (!expense) throw httpError(404, 'Expense not found');
  return expense;
}

async function remove(id, user) {
  if (!isValidObjectId(id)) throw httpError(400, 'Invalid expense id');
  const expense = await Expense.findOneAndDelete({ _id: id, mosqueId: user.mosqueId });
  if (!expense) throw httpError(404, 'Expense not found');
  return expense;
}

module.exports = { listPublic, listAdmin, aggregateSummary, create, update, remove };
