const svc = require('../services/expensesService');

function tryOrNext(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const listExpenses = tryOrNext(async (req, res) => {
  const page = await svc.listPublic(req.query);
  res.json({ success: true, ...page });
});

const summary = tryOrNext(async (req, res) => {
  const totals = await svc.aggregateSummary({ mosqueId: req.query.mosqueId });
  res.json({ success: true, data: totals });
});

const createExpense = tryOrNext(async (req, res) => {
  const expense = await svc.create(req.body, req.user);
  res.status(201).json({ success: true, data: expense });
});

const updateExpense = tryOrNext(async (req, res) => {
  const expense = await svc.update(req.params.id, req.body, req.user);
  res.json({ success: true, data: expense });
});

const removeExpense = tryOrNext(async (req, res) => {
  await svc.remove(req.params.id, req.user);
  res.json({ success: true, message: 'Expense deleted' });
});

module.exports = { listExpenses, summary, createExpense, updateExpense, removeExpense };
