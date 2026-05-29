const { query } = require('../models/db');

// ─────────────────────────────────────────────────────────────────────────────
// GET /houses/:id/rules
// ─────────────────────────────────────────────────────────────────────────────
const listRules = async (req, res, next) => {
  try {
    const houseId = req.params.id;

    const result = await query(
      `SELECT r.*, u.name AS created_by_name
       FROM house_rules r
       JOIN users u ON u.id = r.created_by
       WHERE r.house_id = $1
       ORDER BY r.created_at ASC`,
      [houseId]
    );

    res.json({ rules: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /houses/:id/rules
// ─────────────────────────────────────────────────────────────────────────────
const createRule = async (req, res, next) => {
  try {
    const houseId = req.params.id;
    const userId  = req.user.id;
    const { rule_text } = req.body;

    const result = await query(
      `INSERT INTO house_rules (id, house_id, rule_text, created_by, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING *`,
      [houseId, rule_text.trim(), userId]
    );

    res.status(201).json({ rule: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /rules/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId  = req.user.id;

    const ruleCheck = await query('SELECT * FROM house_rules WHERE id = $1', [id]);
    if (ruleCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    const rule = ruleCheck.rows[0];

    // Must be creator or house admin
    if (rule.created_by !== userId) {
      const adminCheck = await query(
        `SELECT role FROM house_members WHERE house_id = $1 AND user_id = $2 AND role = 'admin'`,
        [rule.house_id, userId]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Only the rule creator or a house admin can delete this rule',
        });
      }
    }

    await query('DELETE FROM house_rules WHERE id = $1', [id]);

    res.json({ message: 'Rule deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listRules, createRule, deleteRule };
