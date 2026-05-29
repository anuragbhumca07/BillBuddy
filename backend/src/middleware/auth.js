const jwt = require('jsonwebtoken');
const { query } = require('../models/db');

/**
 * Verify JWT access token and attach user to req.user.
 * Falls back to DB check if Redis is unavailable.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
      }
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Fetch user from DB to ensure they still exist
    const result = await query(
      'SELECT id, name, email, avatar_url, push_token FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

/**
 * Verify the user is an admin of the given house.
 * Requires req.user to be set (must come after authenticate).
 * Expects houseId in req.params.id or req.params.houseId.
 */
const requireHouseAdmin = async (req, res, next) => {
  try {
    const houseId = req.params.id || req.params.houseId;
    const userId = req.user.id;

    const result = await query(
      'SELECT role FROM house_members WHERE house_id = $1 AND user_id = $2',
      [houseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Not a member of this house' });
    }

    if (result.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin privileges required' });
    }

    next();
  } catch (err) {
    console.error('requireHouseAdmin error:', err);
    return res.status(500).json({ success: false, error: 'Authorization error' });
  }
};

/**
 * Verify the user is a member of the given house.
 */
const requireHouseMember = async (req, res, next) => {
  try {
    const houseId = req.params.id || req.params.houseId;
    const userId = req.user.id;

    const result = await query(
      'SELECT role FROM house_members WHERE house_id = $1 AND user_id = $2',
      [houseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Not a member of this house' });
    }

    req.userHouseRole = result.rows[0].role;
    next();
  } catch (err) {
    console.error('requireHouseMember error:', err);
    return res.status(500).json({ success: false, error: 'Authorization error' });
  }
};

module.exports = { authenticate, requireHouseAdmin, requireHouseMember };
