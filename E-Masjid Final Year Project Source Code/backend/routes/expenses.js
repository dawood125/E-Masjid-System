const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect, authorize } = require('../middleware/auth');

// GET /api/expenses - Get all expenses (public for transparency)
router.get('/', async (req, res, next) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));

    res.json({ success: true, data: expenses, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
});

// GET /api/expenses/summary
router.get('/summary', async (req, res, next) => {
  try {
    const result = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);
    const totalResult = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    res.json({
      success: true,
      data: {
        totalExpenses: totalResult[0]?.total || 0,
        byCategory: result.reduce((acc, item) => { acc[item._id] = item.total; return acc; }, {}),
      },
    });
  } catch (error) { next(error); }
});

// POST /api/expenses - Create expense (admin only)
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, addedBy: req.user._id, mosqueId: req.user.mosqueId });
    res.status(201).json({ success: true, data: expense });
  } catch (error) { next(error); }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (error) { next(error); }
});

// DELETE /api/expenses/:id
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
