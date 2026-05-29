const { query } = require('../models/db');
const { notifyHouseMembers } = require('../services/notificationService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /houses/:id/announcements
// ─────────────────────────────────────────────────────────────────────────────
const listAnnouncements = async (req, res, next) => {
  try {
    const houseId = req.params.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT a.*, u.name AS posted_by_name, u.avatar_url AS posted_by_avatar
       FROM announcements a
       JOIN users u ON u.id = a.posted_by
       WHERE a.house_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [houseId, parseInt(limit, 10), parseInt(offset, 10)]
    );

    res.json({ announcements: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /houses/:id/announcements
// ─────────────────────────────────────────────────────────────────────────────
const createAnnouncement = async (req, res, next) => {
  try {
    const houseId = req.params.id;
    const userId  = req.user.id;
    const { title, message } = req.body;

    const result = await query(
      `INSERT INTO announcements (id, house_id, posted_by, title, message, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      [houseId, userId, title.trim(), message.trim()]
    );

    const announcement = result.rows[0];

    await notifyHouseMembers(
      houseId,
      'announcement',
      `New announcement: "${title}"`,
      userId
    );

    res.status(201).json({ announcement });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /announcements/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId  = req.user.id;

    const announcementCheck = await query(
      'SELECT * FROM announcements WHERE id = $1',
      [id]
    );

    if (announcementCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Announcement not found' });
    }

    const announcement = announcementCheck.rows[0];

    // Must be poster or house admin
    if (announcement.posted_by !== userId) {
      const adminCheck = await query(
        `SELECT role FROM house_members WHERE house_id = $1 AND user_id = $2 AND role = 'admin'`,
        [announcement.house_id, userId]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Only the poster or a house admin can delete this announcement',
        });
      }
    }

    await query('DELETE FROM announcements WHERE id = $1', [id]);

    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAnnouncements, createAnnouncement, deleteAnnouncement };
