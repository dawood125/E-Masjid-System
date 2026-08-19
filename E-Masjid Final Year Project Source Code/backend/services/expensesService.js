const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { sanitizeString, isValidObjectId } = require('../middleware/validate');
const httpError = require('../middleware/httpError');

function toObjectId(id) {
  return mongoose.Types.ObjectId.createFromHexString(id);
}

function monthIndex(month) {
  return new Date(`${month} 1, 2026`).getMonth() + 1;
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
  return {
    totalExpenses: totals[0]?.total || 0,
    byCategory: byCategory.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {}),
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

module.exports = { listPublic, aggregateSummary, create, update, remove };
