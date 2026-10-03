const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const httpError = require('../middleware/httpError');

function rupees(value) {
  return `Rs ${Number(value).toLocaleString('en-PK')}`;
}

async function getBalance(mosqueId) {
  const id = new mongoose.Types.ObjectId(String(mosqueId));
  const [donations] = await Donation.aggregate([
    { $match: { mosqueId: id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const [expenses] = await Expense.aggregate([
    { $match: { mosqueId: id } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalDonations = donations?.total || 0;
  const totalExpenses = expenses?.total || 0;
  return { totalDonations, totalExpenses, available: totalDonations - totalExpenses };
}

async function ensureExpenseFits(mosqueId, extraExpense) {
  if (extraExpense <= 0) return;
  const { available } = await getBalance(mosqueId);
  if (extraExpense > available) {
    throw httpError(400, `Expenses cannot be more than donations. Available balance is ${rupees(Math.max(available, 0))}.`);
  }
}

async function ensureDonationDropFits(mosqueId, donationDrop) {
  if (donationDrop <= 0) return;
  const { totalDonations, totalExpenses } = await getBalance(mosqueId);
  if (totalDonations - donationDrop < totalExpenses) {
    throw httpError(400, `This would leave donations (${rupees(totalDonations - donationDrop)}) below expenses (${rupees(totalExpenses)}). Reduce expenses first.`);
  }
}

module.exports = { getBalance, ensureExpenseFits, ensureDonationDropFits };
