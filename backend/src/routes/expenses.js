const express = require('express');
const router  = express.Router({ mergeParams: true });

const {
  listExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  settleExpense,
  getBalances,
} = require('../controllers/expenseController');
const { authenticate, requireHouseMember } = require('../middleware/auth');
const { createExpenseRules, uuidParam, validate } = require('../utils/validators');
const { upload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

// Routes scoped under /houses/:id/expenses
// GET /houses/:id/expenses
router.get('/', requireHouseMember, listExpenses);

// POST /houses/:id/expenses
router.post(
  '/',
  requireHouseMember,
  uploadLimiter,
  upload.single('receipt'),
  createExpenseRules,
  validate,
  createExpense
);

// GET /houses/:id/balances
router.get('/balances', requireHouseMember, getBalances);

// Routes scoped at the expense level (standalone /expenses/:id)
// GET /expenses/:id
router.get('/:id', [uuidParam('id'), validate], getExpense);

// PUT /expenses/:id
router.put(
  '/:id',
  [uuidParam('id'), validate],
  uploadLimiter,
  upload.single('receipt'),
  updateExpense
);

// DELETE /expenses/:id
router.delete('/:id', [uuidParam('id'), validate], deleteExpense);

// POST /expenses/:id/settle
router.post('/:id/settle', [uuidParam('id'), validate], settleExpense);

module.exports = router;
