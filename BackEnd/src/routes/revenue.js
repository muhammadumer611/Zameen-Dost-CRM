const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const {
  getRevenue,
  toggleSecurities,
  addIncome,
  addExpense,
  addSecurity,
  settleSecurity,
  getTransactions,
} = require('../controllers/revenueController');

// ✅ All routes protected
router.use(verifyToken);

// ✅ Revenue routes
router.get('/', getRevenue);
router.get('/transactions', getTransactions);
router.put('/toggle-securities', toggleSecurities);

// ✅ Add transactions
router.post('/income', addIncome);
router.post('/expense', addExpense);
router.post('/security', addSecurity);
router.post('/security/settle', settleSecurity);

module.exports = router;