const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: [true, 'Description is required'] },
  amount: { type: Number, required: [true, 'Amount is required'], min: 1 },
  category: {
    type: String,
    enum: ['Maintenance', 'Utilities', 'Salary', 'Events', 'Charity', 'Renovation', 'Education', 'Equipment', 'Other'],
    required: true,
  },
  mosqueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mosque' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
