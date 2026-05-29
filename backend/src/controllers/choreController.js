const { query, getClient } = require('../models/db');
const { notifyHouseMembers, notifyUser } = require('../services/notificationService');
const socketService = require('../services/socketService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /houses/:id/chores
// ─────────────────────────────────────────────────────────────────────────────
const listChores = async (req, res, next) => {
  try {
    const houseId = req.params.id;
    const { assigned_to, completed } = req.query;

    const conditions = ['c.house_id = $1'];
    const values     = [houseId];
    let paramIdx     = 2;

    if (assigned_to) {
      conditions.push(`c.assigned_to = $${paramIdx++}`);
      values.push(assigned_to);
    }
    if (completed !== undefined) {
      conditions.push(`c.is_completed = $${paramIdx++}`);
      values.push(completed === 'true');
    }

    const result = await query(
      `SELECT c.*,
              u.name AS assigned_to_name,
              u.avatar_url AS assigned_to_avatar
       FROM chores c
       LEFT JOIN users u ON u.id = c.assigned_to
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.is_completed ASC, c.due_date ASC NULLS LAST`,
      values
    );

    res.json({ chores: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /houses/:id/chores
// ─────────────────────────────────────────────────────────────────────────────
const createChore = async (req, res, next) => {
  try {
    const houseId = req.params.id;
    const { title, description, frequency, assigned_to, due_date } = req.body;

    // Validate assigned_to is a house member if provided
    if (assigned_to) {
      const memberCheck = await query(
        'SELECT id FROM house_members WHERE house_id = $1 AND user_id = $2',
        [houseId, assigned_to]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'Assigned user is not a member of this house' });
      }
    }

    const result = await query(
      `INSERT INTO chores (id, house_id, title, description, frequency, assigned_to, due_date, is_completed, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, false, NOW())
       RETURNING *`,
      [houseId, title.trim(), description || null, frequency, assigned_to || null, due_date || null]
    );

    const chore = result.rows[0];

    // Notify assigned user or all members
    if (assigned_to) {
      await notifyUser(
        assigned_to,
        'chore_assigned',
        `You've been assigned the chore: "${title}"`
      );
    } else {
      await notifyHouseMembers(houseId, 'chore_created', `New chore added: "${title}"`, req.user.id);
    }

    socketService.emitToHouse(houseId, 'chore:updated', chore);

    res.status(201).json({ chore });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /chores/:id
// ─────────────────────────────────────────────────────────────────────────────
const getChore = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*,
              u.name AS assigned_to_name,
              u.avatar_url AS assigned_to_avatar
       FROM chores c
       LEFT JOIN users u ON u.id = c.assigned_to
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Chore not found' });
    }

    res.json({ chore: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /chores/:id
// ─────────────────────────────────────────────────────────────────────────────
const updateChore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, frequency, assigned_to, due_date } = req.body;

    const choreCheck = await query('SELECT * FROM chores WHERE id = $1', [id]);
    if (choreCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Chore not found' });
    }

    const updates = [];
    const values  = [];
    let paramIdx  = 1;

    if (title !== undefined)       { updates.push(`title = $${paramIdx++}`);       values.push(title.trim()); }
    if (description !== undefined) { updates.push(`description = $${paramIdx++}`); values.push(description); }
    if (frequency !== undefined)   { updates.push(`frequency = $${paramIdx++}`);   values.push(frequency); }
    if (assigned_to !== undefined) { updates.push(`assigned_to = $${paramIdx++}`); values.push(assigned_to); }
    if (due_date !== undefined)    { updates.push(`due_date = $${paramIdx++}`);    values.push(due_date); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id);
    const result = await query(
      `UPDATE chores SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    const chore = result.rows[0];
    socketService.emitToHouse(chore.house_id, 'chore:updated', chore);

    res.json({ chore });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /chores/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteChore = async (req, res, next) => {
  try {
    const { id } = req.params;

    const choreCheck = await query('SELECT id, house_id FROM chores WHERE id = $1', [id]);
    if (choreCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Chore not found' });
    }

    await query('DELETE FROM chore_history WHERE chore_id = $1', [id]);
    await query('DELETE FROM chores WHERE id = $1', [id]);

    res.json({ message: 'Chore deleted' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /chores/:id/complete
// ─────────────────────────────────────────────────────────────────────────────
const completeChore = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const userId = req.user.id;

    const choreResult = await client.query('SELECT * FROM chores WHERE id = $1', [id]);
    if (choreResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Chore not found' });
    }

    const chore = choreResult.rows[0];

    // Mark chore as completed
    await client.query(
      `UPDATE chores SET is_completed = true, completed_at = NOW() WHERE id = $1`,
      [id]
    );

    // Record in history
    await client.query(
      `INSERT INTO chore_history (chore_id, completed_by, completed_at)
       VALUES ($1, $2, NOW())`,
      [id, userId]
    );

    // Round-robin: assign to next house member
    const membersResult = await client.query(
      `SELECT user_id FROM house_members WHERE house_id = $1 ORDER BY joined_at ASC`,
      [chore.house_id]
    );

    const members    = membersResult.rows.map((m) => m.user_id);
    const currentIdx = members.indexOf(chore.assigned_to || userId);
    const nextIdx    = (currentIdx + 1) % members.length;
    const nextUserId = members[nextIdx];

    // Calculate next due date
    const nextDueDate = calculateNextDueDate(chore.frequency);

    const updatedResult = await client.query(
      `UPDATE chores
       SET is_completed = false, completed_at = NULL, assigned_to = $1, due_date = $2
       WHERE id = $3
       RETURNING *`,
      [nextUserId, nextDueDate, id]
    );

    await client.query('COMMIT');

    const updatedChore = updatedResult.rows[0];

    // Notify next assignee
    await notifyUser(
      nextUserId,
      'chore_assigned',
      `You're next for the chore: "${chore.title}"`
    );

    socketService.emitToHouse(chore.house_id, 'chore:updated', updatedChore);

    res.json({ chore: updatedChore });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /houses/:id/chores/history
// ─────────────────────────────────────────────────────────────────────────────
const getChoreHistory = async (req, res, next) => {
  try {
    const houseId = req.params.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT ch.*, c.title AS chore_title, u.name AS completed_by_name
       FROM chore_history ch
       JOIN chores c ON c.id = ch.chore_id
       JOIN users u  ON u.id = ch.completed_by
       WHERE c.house_id = $1
       ORDER BY ch.completed_at DESC
       LIMIT $2 OFFSET $3`,
      [houseId, parseInt(limit, 10), parseInt(offset, 10)]
    );

    res.json({ history: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
const calculateNextDueDate = (frequency) => {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      now.setDate(now.getDate() + 7);
  }
  return now;
};

module.exports = {
  listChores,
  createChore,
  getChore,
  updateChore,
  deleteChore,
  completeChore,
  getChoreHistory,
};
