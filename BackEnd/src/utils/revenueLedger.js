const Revenue = require('../models/Revenue');

function isSecurityRefundExpense(entry) {
  const text = `${entry?.type || ''} ${entry?.category || ''}`.toLowerCase();
  return text.includes('security refund') || text.includes('security returned');
}

function isSecurityDepositIncome(entry) {
  const type = String(entry?.type || '').toLowerCase();
  const category = String(entry?.category || '').toLowerCase();
  if (type.includes('forfeit') || category.includes('forfeit')) return false;
  return type === 'security' || category === 'security';
}

function sameId(a, b) {
  if (a == null || b == null || a === '' || b === '') return false;
  return String(a) === String(b);
}

async function getOrCreateRevenue() {
  let revenue = await Revenue.findOne();
  if (!revenue) {
    revenue = await Revenue.create({
      income: [],
      expenses: [],
      securities: [],
      includeSecurities: false,
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
    });
  }
  return revenue;
}

function recalculate(revenue) {
  const totalIncome = (revenue.income || [])
    .filter((item) => !isSecurityDepositIncome(item))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalExpenses = (revenue.expenses || [])
    .filter((item) => !isSecurityRefundExpense(item))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalSecurities = (revenue.securities || [])
    .filter((item) => item.status === 'Held')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalRevenue = revenue.includeSecurities ? totalIncome + totalSecurities : totalIncome;

  revenue.totalRevenue = totalRevenue;
  revenue.totalExpenses = totalExpenses;
  revenue.netProfit = totalRevenue - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    totalSecurities,
    totalRevenue,
    netProfit: totalRevenue - totalExpenses,
    includeSecurities: revenue.includeSecurities,
  };
}

async function recordSecurityReceived(payload = {}) {
  const amount = Number(payload.amount) || 0;
  if (amount <= 0) return getOrCreateRevenue();

  const revenue = await getOrCreateRevenue();
  const now = payload.createdAt || new Date().toISOString();
  const tenantName = payload.tenantName || 'Tenant';

  revenue.securities.push({
    ...payload,
    id: payload.id || `security-${Date.now()}`,
    eventType: 'Received',
    tenantName,
    unitNo: payload.unitNo || '',
    buildingNo: payload.buildingNo || '',
    buildingId: payload.buildingId || null,
    unitId: payload.unitId || null,
    amount,
    status: 'Held',
    description: payload.description || `Security received from ${tenantName}`,
    source: payload.source || 'Security',
    remarks: payload.remarks || '',
    createdAt: now,
  });

  recalculate(revenue);
  await revenue.save();
  return revenue;
}

async function recordIncome(payload = {}) {
  const amount = Number(payload.amount) || 0;
  if (amount <= 0) return getOrCreateRevenue();

  if (isSecurityDepositIncome(payload)) {
    return recordSecurityReceived({
      ...payload,
      tenantName: payload.tenantName || payload.customerName,
      description: payload.description || `Security received from ${payload.tenantName || payload.customerName || 'Tenant'}`,
    });
  }

  const revenue = await getOrCreateRevenue();
  const now = payload.createdAt || payload.receivedAt || new Date().toISOString();

  revenue.income.push({
    ...payload,
    id: payload.id || `income-${Date.now()}`,
    type: payload.type || 'Income',
    transactionType: 'Income',
    amount,
    createdAt: now,
    receivedAt: payload.receivedAt || now,
  });

  recalculate(revenue);
  await revenue.save();
  return revenue;
}

async function recordExpense(payload = {}) {
  const amount = Number(payload.amount) || 0;
  if (amount <= 0) return getOrCreateRevenue();

  const revenue = await getOrCreateRevenue();
  const now = payload.createdAt || payload.paidAt || new Date().toISOString();

  revenue.expenses.push({
    ...payload,
    id: payload.id || `expense-${Date.now()}`,
    type: payload.type || 'Expense',
    transactionType: 'Expense',
    amount,
    createdAt: now,
    paidAt: payload.paidAt || now,
  });

  recalculate(revenue);
  await revenue.save();
  return revenue;
}

function findHeldSecurities(revenue, { unitId, buildingId, tenantName, unitNo }) {
  return (revenue.securities || []).filter((item) => {
    if (item.status !== 'Held') return false;
    if (unitId && sameId(item.unitId, unitId)) return true;
    if (buildingId && unitNo && sameId(item.buildingId, buildingId) && String(item.unitNo) === String(unitNo)) {
      return true;
    }
    if (tenantName && unitNo && item.tenantName === tenantName && String(item.unitNo) === String(unitNo)) {
      return true;
    }
    return false;
  });
}

async function settleSecurity(payload = {}) {
  const returnAmount = Number(payload.returnAmount) || 0;
  const forfeitAmount = Number(payload.forfeitAmount) || 0;
  if (returnAmount <= 0 && forfeitAmount <= 0) {
    return getOrCreateRevenue();
  }

  const revenue = await getOrCreateRevenue();
  const now = payload.createdAt || new Date().toISOString();
  const tenantName = payload.tenantName || 'Tenant';
  const unitNo = payload.unitNo || '';
  const remarks = payload.remarks || '';

  const held = findHeldSecurities(revenue, payload);
  let remainingReturn = returnAmount;
  let remainingForfeit = forfeitAmount;

  held.forEach((item) => {
    if (remainingReturn <= 0 && remainingForfeit <= 0) return;
    let take = Number(item.amount) || 0;
    const returnedTake = Math.min(take, remainingReturn);
    take -= returnedTake;
    remainingReturn -= returnedTake;
    const forfeitedTake = Math.min(take, remainingForfeit);
    remainingForfeit -= forfeitedTake;

    item.status = 'Settled';
    item.returnedAmount = (Number(item.returnedAmount) || 0) + returnedTake;
    item.forfeitedAmount = (Number(item.forfeitedAmount) || 0) + forfeitedTake;
    item.returnDate = now;
    item.remarks = remarks || item.remarks;
  });

  if (returnAmount > 0) {
    revenue.securities.push({
      id: payload.returnId || `security-return-${Date.now()}`,
      eventType: 'Returned',
      tenantName,
      unitNo,
      buildingNo: payload.buildingNo || '',
      buildingId: payload.buildingId || null,
      unitId: payload.unitId || null,
      amount: returnAmount,
      status: 'Returned',
      description: payload.returnDescription || `Security returned to ${tenantName}${unitNo ? ` - Unit ${unitNo}` : ''}`,
      source: 'Security',
      remarks,
      returnDate: now,
      returnedAmount: returnAmount,
      createdAt: now,
    });
  }

  if (forfeitAmount > 0) {
    revenue.securities.push({
      id: payload.forfeitId || `security-forfeit-${Date.now()}`,
      eventType: 'Forfeited',
      tenantName,
      unitNo,
      buildingNo: payload.buildingNo || '',
      buildingId: payload.buildingId || null,
      unitId: payload.unitId || null,
      amount: forfeitAmount,
      status: 'Forfeited',
      description: payload.forfeitDescription || `Security forfeited from ${tenantName}${unitNo ? ` - Unit ${unitNo}` : ''}`,
      source: 'Security',
      remarks,
      forfeitedAmount: forfeitAmount,
      createdAt: now,
    });

    revenue.income.push({
      id: payload.incomeId || `income-forfeit-${Date.now()}`,
      type: 'Security Forfeited',
      transactionType: 'Income',
      category: 'Security Income',
      description: payload.forfeitDescription || `Security forfeited from ${tenantName}${unitNo ? ` - Unit ${unitNo}` : ''}`,
      amount: forfeitAmount,
      source: 'Security',
      buildingId: payload.buildingId || null,
      unitId: payload.unitId || null,
      unitNo,
      tenantName,
      remarks,
      status: 'Received',
      receivedAt: now,
      createdAt: now,
    });
  }

  recalculate(revenue);
  await revenue.save();
  return revenue;
}

function toPlain(doc) {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject();
  return doc._doc || doc;
}

function buildTransactions(revenue) {
  const transactions = [];

  (revenue.income || []).forEach((item) => {
    if (!item || isSecurityDepositIncome(item)) return;
    const plain = toPlain(item);
    const isForfeit =
      String(plain.type || '').toLowerCase().includes('forfeit') ||
      String(plain.category || '').toLowerCase().includes('forfeit');
    transactions.push({
      ...plain,
      type: isForfeit ? 'Security Forfeited' : 'Income',
      date: plain.receivedAt || plain.createdAt,
    });
  });

  (revenue.expenses || []).forEach((item) => {
    if (!item || isSecurityRefundExpense(item)) return;
    const plain = toPlain(item);
    transactions.push({
      ...plain,
      type: 'Expense',
      date: plain.paidAt || plain.createdAt,
    });
  });

  (revenue.securities || []).forEach((item) => {
    if (!item) return;
    const plain = toPlain(item);
    const eventType = plain.eventType || (plain.status === 'Returned' ? 'Returned' : plain.status === 'Forfeited' ? 'Forfeited' : 'Received');
    if (eventType === 'Forfeited') return;
    transactions.push({
      ...plain,
      type: eventType === 'Returned' ? 'Security Returned' : 'Security',
      date: plain.createdAt || new Date().toISOString(),
      description: plain.description || `Security from ${plain.tenantName || 'Tenant'}`,
    });
  });

  transactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  return transactions;
}

module.exports = {
  getOrCreateRevenue,
  recalculate,
  recordSecurityReceived,
  recordIncome,
  recordExpense,
  settleSecurity,
  buildTransactions,
  isSecurityDepositIncome,
  isSecurityRefundExpense,
};
