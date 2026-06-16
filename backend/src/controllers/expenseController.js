const { query, getClient } = require('../models/db');
const { simplifyDebts } = require('../utils/debtSimplification');
const { notifyHouseMembers } = require('../services/notificationService');
const socketService = require('../services/socketService');
const { getFileUrl } = require('../middleware/upload');

// ─────────────────────────────────────────────────────────────────────────────
// GET /houses/:id/expenses
// ─────────────────────────────────────────────────────────────────────────────
const listExpenses = async (req, res, next) => {
  try {
    const houseId = req.params.id || req.houseId;
    const { person, category, from, to, limit = 50, offset = 0 } = req.query;

    const conditions = ['e.house_id = $1'];
    const values     = [houseId];
    let paramIdx     = 2;

    if (person) {
      conditions.push(`e.paid_by = $${paramIdx++}`);
      values.push(person);
    }
    if (category) {
      conditions.push(`e.category = $${paramIdx++}`);
      values.push(category);
    }
    if (from) {
      conditions.push(`e.date >= $${paramIdx++}`);
      values.push(from);
    }
    if (to) {
      conditions.push(`e.date <= $${paramIdx++}`);
      values.push(to);
    }

    values.push(parseInt(limit, 10));
    values.push(parseInt(offset, 10));

    const sql = `
      SELECT e.*,
             u.name AS paid_by_name,
             u.avatar_url AS paid_by_avatar
      FROM expenses e
      JOIN users u ON u.id = e.paid_by
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const [expensesResult, countResult] = await Promise.all([
      query(sql, values),
      query(
        `SELECT COUNT(*)::int AS total FROM expenses e WHERE ${conditions.join(' AND ')}`,
        values.slice(0, -2)
      ),
    ]);

    res.json({
      expenses: expensesResult.rows,
      total:    countResult.rows[0].total,
      limit:    parseInt(limit, 10),
      offset:   parseInt(offset, 10),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /houses/:id/expenses
// ─────────────────────────────────────────────────────────────────────────────
const createExpense = async (req, res, next) => {
  try {
    const houseId = req.params.id || req.houseId;
    const paidBy  = req.user.id;
    const { title, amount, category, date, splits } = req.body;
    const receiptUrl = getFileUrl(req);

    let expense;
    let splitMismatch = null;
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const expenseResult = await client.query(
        `INSERT INTO expenses (id, house_id, paid_by, title, amount, category, receipt_url, date, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [houseId, paidBy, title.trim(), parseFloat(amount), category || null, receiptUrl, date || new Date()]
      );
      expense = expenseResult.rows[0];

      let splitEntries = [];
      if (splits && Array.isArray(splits) && splits.length > 0) {
        const totalSplit   = splits.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        const rounded      = Math.round(totalSplit * 100) / 100;
        const expenseAmount = Math.round(parseFloat(amount) * 100) / 100;
        if (Math.abs(rounded - expenseAmount) > 0.01) {
          await client.query('ROLLBACK');
          splitMismatch = `Custom splits sum (${rounded}) does not match expense amount (${expenseAmount})`;
        } else {
          splitEntries = splits.map((s) => ({ user_id: s.user_id, amount_owed: parseFloat(s.amount) }));
        }
      } else {
        const membersResult = await client.query(
          'SELECT user_id FROM house_members WHERE house_id = $1',
          [houseId]
        );
        const memberCount = membersResult.rows.length;
        const splitAmount = Math.round((parseFloat(amount) / memberCount) * 100) / 100;
        splitEntries = membersResult.rows.map((m) => ({ user_id: m.user_id, amount_owed: splitAmount }));
      }

      if (!splitMismatch) {
        for (const split of splitEntries) {
          await client.query(
            `INSERT INTO expense_splits (expense_id, user_id, amount_owed, is_settled)
             VALUES ($1, $2, $3, false)`,
            [expense.id, split.user_id, split.amount_owed]
          );
        }
        await client.query('COMMIT');
      }
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw err;
    } finally {
      client.release(); // Always release before post-commit work
    }

    if (splitMismatch) {
      return res.status(400).json({ success: false, error: splitMismatch });
    }

    // Post-commit: client already released
    const fullExpense = await getExpenseWithSplits(expense.id);
    await notifyHouseMembers(
      houseId,
      'expense_added',
      `${req.user.name} added expense "${title}" — $${parseFloat(amount).toFixed(2)}`,
      paidBy
    );
    socketService.emitToHouse(houseId, 'expense:new', fullExpense);
    res.status(201).json({ expense: { ...fullExpense, splits: undefined }, splits: fullExpense.splits });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /expenses/:id
// ─────────────────────────────────────────────────────────────────────────────
const getExpense = async (req, res, next) => {
  try {
    const expense = await getExpenseWithSplits(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ expense: { ...expense, splits: undefined }, splits: expense.splits });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /expenses/:id
// ─────────────────────────────────────────────────────────────────────────────
const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date } = req.body;

    const expenseCheck = await query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (expenseCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const expense = expenseCheck.rows[0];

    // Only the payer or house admin can update
    if (expense.paid_by !== req.user.id) {
      const adminCheck = await query(
        `SELECT role FROM house_members WHERE house_id = $1 AND user_id = $2 AND role = 'admin'`,
        [expense.house_id, req.user.id]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Only the payer or an admin can update this expense' });
      }
    }

    const updates = [];
    const values  = [];
    let idx = 1;

    if (title)    { updates.push(`title = $${idx++}`);    values.push(title.trim()); }
    if (amount)   { updates.push(`amount = $${idx++}`);   values.push(parseFloat(amount)); }
    if (category) { updates.push(`category = $${idx++}`); values.push(category); }
    if (date)     { updates.push(`date = $${idx++}`);     values.push(date); }

    if (req.file) {
      const receiptUrl = getFileUrl(req);
      updates.push(`receipt_url = $${idx++}`);
      values.push(receiptUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id);
    const result = await query(
      `UPDATE expenses SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ expense: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /expenses/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expenseCheck = await query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (expenseCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const expense = expenseCheck.rows[0];

    if (expense.paid_by !== req.user.id) {
      const adminCheck = await query(
        `SELECT role FROM house_members WHERE house_id = $1 AND user_id = $2 AND role = 'admin'`,
        [expense.house_id, req.user.id]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Only the payer or an admin can delete this expense' });
      }
    }

    // Splits cascade via FK; delete splits first if no CASCADE defined
    await query('DELETE FROM expense_splits WHERE expense_id = $1', [id]);
    await query('DELETE FROM expenses WHERE id = $1', [id]);

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /expenses/:id/settle
// ─────────────────────────────────────────────────────────────────────────────
const settleExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await query(
      `UPDATE expense_splits
       SET is_settled = true, settled_at = NOW()
       WHERE expense_id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No split found for this user on this expense' });
    }

    res.json({ split: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /houses/:id/balances
// ─────────────────────────────────────────────────────────────────────────────
const getBalances = async (req, res, next) => {
  try {
    const houseId = req.params.id || req.houseId;

    // Get all unsettled splits for this house
    const splitsResult = await query(
      `SELECT es.user_id AS debtor,
              e.paid_by  AS creditor,
              es.amount_owed
       FROM expense_splits es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.house_id = $1
         AND es.is_settled = false
         AND es.user_id != e.paid_by`,
      [houseId]
    );

    const rawDebts = splitsResult.rows.map((row) => ({
      from:   row.debtor,
      to:     row.creditor,
      amount: parseFloat(row.amount_owed),
    }));

    const simplified = simplifyDebts(rawDebts);

    // Build user name map for readable output
    const userIds = [...new Set([
      ...simplified.map((d) => d.from),
      ...simplified.map((d) => d.to),
    ])];

    const userMap = {};
    if (userIds.length > 0) {
      const usersResult = await query(
        `SELECT id, name FROM users WHERE id = ANY($1::uuid[])`,
        [userIds]
      );
      usersResult.rows.forEach((u) => { userMap[u.id] = u.name; });
    }

    const summary = simplified.map((t) => ({
      ...t,
      from_name: userMap[t.from] || t.from,
      to_name:   userMap[t.to]   || t.to,
    }));

    res.json({ balances: summary, debts: summary });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper
// ─────────────────────────────────────────────────────────────────────────────
const getExpenseWithSplits = async (expenseId) => {
  const [expenseResult, splitsResult] = await Promise.all([
    query(
      `SELECT e.*, u.name AS paid_by_name, u.avatar_url AS paid_by_avatar
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.id = $1`,
      [expenseId]
    ),
    query(
      `SELECT es.*, u.name AS user_name, u.avatar_url AS user_avatar
       FROM expense_splits es
       JOIN users u ON u.id = es.user_id
       WHERE es.expense_id = $1`,
      [expenseId]
    ),
  ]);

  if (expenseResult.rows.length === 0) return null;

  return {
    ...expenseResult.rows[0],
    splits: splitsResult.rows,
  };
};

module.exports = {
  listExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  settleExpense,
  getBalances,
};
