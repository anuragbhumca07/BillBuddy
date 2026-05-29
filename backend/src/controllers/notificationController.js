const { query } = require('../models/db');

// ─────────────────────────────────────────────────────────────────────────────
// GET /notifications
// ─────────────────────────────────────────────────────────────────────────────
const listNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 30, offset = 0, unread_only } = req.query;

    const conditions = ['user_id = $1'];
    const values     = [userId];
    let paramIdx     = 2;

    if (unread_only === 'true') {
      conditions.push(`is_read = false`);
    }

    values.push(parseInt(limit, 10));
    values.push(parseInt(offset, 10));

    const [notifResult, countResult] = await Promise.all([
      query(
        `SELECT * FROM notifications
         WHERE ${conditions.join(' AND ')}
         ORDER BY created_at DESC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        values
      ),
      query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE is_read = false)::int AS unread
         FROM notifications WHERE ${conditions.slice(0, 1).join(' AND ')}`,
        [userId]
      ),
    ]);

    res.json({
      notifications: notifResult.rows,
      total:         countResult.rows[0].total,
      unread:        countResult.rows[0].unread,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId  = req.user.id;

    const result = await query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /notifications/read-all  (bonus endpoint for marking all read)
// ─────────────────────────────────────────────────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({ updated: result.rowCount });
  } catch (err) {
    next(err);
  }
};

module.exports = { listNotifications, markAsRead, markAllAsRead };
