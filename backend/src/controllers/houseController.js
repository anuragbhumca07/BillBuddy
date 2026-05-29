const { query, getClient } = require('../models/db');
const { generateUniqueInviteCode } = require('../utils/inviteCode');
const { notifyHouseMembers } = require('../services/notificationService');

// ─── POST /houses ─────────────────────────────────────────────────────────────
const createHouse = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { name, address } = req.body;
    const userId = req.user.id;

    const inviteCode = await generateUniqueInviteCode();

    const houseResult = await client.query(
      `INSERT INTO houses (id, name, address, invite_code, created_by, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      [name.trim(), address || null, inviteCode, userId]
    );

    const house = houseResult.rows[0];

    await client.query(
      `INSERT INTO house_members (house_id, user_id, role, joined_at)
       VALUES ($1, $2, 'admin', NOW())`,
      [house.id, userId]
    );

    await client.query('COMMIT');
    res.status(201).json({ house });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ─── GET /houses/mine ─────────────────────────────────────────────────────────
const getMyHouse = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT h.*, COUNT(hm2.user_id)::int AS member_count, u.name AS created_by_name,
              hm.role AS my_role
       FROM house_members hm
       JOIN houses h ON h.id = hm.house_id
       LEFT JOIN house_members hm2 ON hm2.house_id = h.id
       LEFT JOIN users u ON u.id = h.created_by
       WHERE hm.user_id = $1
       GROUP BY h.id, u.name, hm.role
       ORDER BY hm.joined_at ASC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Not a member of any house' });
    }

    res.json({ house: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── GET /houses/:id ─────────────────────────────────────────────────────────
const getHouse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT h.*, COUNT(hm.user_id)::int AS member_count, u.name AS created_by_name
       FROM houses h
       LEFT JOIN house_members hm ON hm.house_id = h.id
       LEFT JOIN users u ON u.id = h.created_by
       WHERE h.id = $1
       GROUP BY h.id, u.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'House not found' });
    }

    res.json({ house: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─── POST /houses/join ────────────────────────────────────────────────────────
const joinHouse = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Accept both invite_code and code (mobile sends 'code')
    const code = req.body.invite_code || req.body.code;
    if (!code) {
      return res.status(400).json({ success: false, error: 'invite_code is required' });
    }

    const userId = req.user.id;

    const houseResult = await client.query(
      'SELECT * FROM houses WHERE UPPER(invite_code) = $1',
      [code.toUpperCase()]
    );

    if (houseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }

    const house = houseResult.rows[0];

    const memberCheck = await client.query(
      'SELECT id FROM house_members WHERE house_id = $1 AND user_id = $2',
      [house.id, userId]
    );

    if (memberCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Already a member of this house' });
    }

    await client.query(
      `INSERT INTO house_members (house_id, user_id, role, joined_at) VALUES ($1, $2, 'member', NOW())`,
      [house.id, userId]
    );

    await client.query('COMMIT');

    await notifyHouseMembers(house.id, 'member_joined', `${req.user.name} joined ${house.name}!`, userId);

    res.json({ house });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ─── GET /houses/:id/members (also /houses/members via mine middleware) ───────
const getHouseMembers = async (req, res, next) => {
  try {
    const houseId = req.params.id;

    const result = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, hm.role, hm.joined_at, hm.house_id
       FROM house_members hm
       JOIN users u ON u.id = hm.user_id
       WHERE hm.house_id = $1
       ORDER BY hm.role DESC, hm.joined_at ASC`,
      [houseId]
    );

    res.json({ members: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /houses/:id/members/:userId ───────────────────────────────────────
const removeMember = async (req, res, next) => {
  try {
    const houseId      = req.params.id;
    const targetUserId = req.params.userId;
    const requesterId  = req.user.id;

    if (targetUserId === requesterId) {
      return res.status(400).json({ success: false, error: 'Use leave endpoint to remove yourself' });
    }

    const result = await query(
      'DELETE FROM house_members WHERE house_id = $1 AND user_id = $2 RETURNING *',
      [houseId, targetUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Member not found in this house' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createHouse, getMyHouse, getHouse, joinHouse, getHouseMembers, removeMember };
