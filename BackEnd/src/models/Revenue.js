const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
  // ✅ Income
  income: [{
    id: { type: String },
    type: { type: String, default: 'Income' },
    transactionType: { type: String, default: 'Income' },
    category: { type: String },
    description: { type: String },
    amount: { type: Number, required: true },
    source: { type: String },
   buildingId: { type: mongoose.Schema.Types.Mixed, default: null },
    unitId: { type: mongoose.Schema.Types.Mixed, default: null },
    unitNo: { type: String },
    tenantName: { type: String },
    months: { type: Number, default: 1 },
    remarks: { type: String },
    status: { type: String, enum: ['Received', 'Pending'], default: 'Received' },
    receivedAt: { type: String },
    createdAt: { type: String },
  }],
  
  // ✅ Expenses
  expenses: [{
    id: { type: String },
    type: { type: String, default: 'Expense' },
    transactionType: { type: String, default: 'Expense' },
    category: { type: String },
    description: { type: String },
    amount: { type: Number, required: true },
    paidTo: { type: String },
    employeeId: { type: mongoose.Schema.Types.Mixed, default: null },
    employeeName: { type: String },
    fullSalary: { type: Number },
    month: { type: String },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
    deductions: {
      leaveDeduction: { type: Number, default: 0 },
      lateDeduction: { type: Number, default: 0 },
      taskFailureDeduction: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      leaves: { type: Number, default: 0 },
      lateMinutes: { type: Number, default: 0 },
      failedTasks: { type: Number, default: 0 },
    },
    salaryPayment: {
      employeeId: { type: Number },
      amount: { type: Number },
      fullSalary: { type: Number },
      month: { type: String },
      remarks: { type: String },
      deductions: { type: Number, default: 0 },
    },
    paidAt: { type: String },
    createdAt: { type: String },
  }],
  
  // ✅ Securities
  securities: [{
    id: { type: String },
    eventType: { type: String, enum: ['Received', 'Returned', 'Forfeited'], default: 'Received' },
    tenantName: { type: String },
    unitNo: { type: String },
    buildingNo: { type: String },
    buildingId: { type: mongoose.Schema.Types.Mixed, default: null },
    unitId: { type: mongoose.Schema.Types.Mixed, default: null },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Held', 'Returned', 'Forfeited', 'Settled'], default: 'Held' },
    description: { type: String },
    source: { type: String },
    returnDate: { type: String },
    returnedAmount: { type: Number, default: 0 },
    forfeitedAmount: { type: Number, default: 0 },
    remarks: { type: String },
    createdAt: { type: String },
  }],
  
  // ✅ Settings
  includeSecurities: {
    type: Boolean,
    default: false,
  },
  
  // ✅ Calculated fields (cached for performance)
  totalRevenue: {
    type: Number,
    default: 0,
  },
  totalExpenses: {
    type: Number,
    default: 0,
  },
  netProfit: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Revenue', revenueSchema);