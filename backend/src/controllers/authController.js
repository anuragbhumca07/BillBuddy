const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../models/db');

let redisClient = null;
const memTokens = new Map(); // in-memory fallback when Redis is not available

const setRedisClient = (client) => { redisClient = client; };

const generateAccessToken  = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET,         { expiresIn: '15m' });
const generateRefreshToken = (userId) => jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const storeRefreshToken = async (userId, token) => {
  if (redisClient) {
    try { await redisClient.set(`refresh:${userId}`, token, { EX: 7 * 24 * 60 * 60 }); return; }
    catch (err) { console.warn('Redis storeRefreshToken failed:', err.message); }
  }
  memTokens.set(`refresh:${userId}`, token);
};

const getStoredRefreshToken = async (userId) => {
  if (redisClient) {
    try { return await redisClient.get(`refresh:${userId}`); }
    catch (err) { console.warn('Redis getStoredRefreshToken failed:', err.message); }
  }
  return memTokens.get(`refresh:${userId}`) ?? null;
};

const deleteRefreshToken = async (userId) => {
  if (redisClient) {
    try { await redisClient.del(`refresh:${userId}`); return; }
    catch (err) { console.warn('Redis deleteRefreshToken failed:', err.message); }
  }
  memTokens.delete(`refresh:${userId}`);
};

// ─── POST /auth/register ──────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (id, name, email, password_hash, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING id, name, email, avatar_url, created_at`,
      [name.trim(), email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const accessToken  = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, name, email, password_hash, avatar_url, push_token FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user  = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const accessToken  = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await storeRefreshToken(user.id, refreshToken);

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/logout ────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Accept both camelCase (mobile) and snake_case (legacy) token field names
    const token = req.body.refreshToken || req.body.refresh_token;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await deleteRefreshToken(decoded.userId);
    } catch {
      // Expired/invalid token — still respond OK so client can clear state
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
const refresh = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.body.refresh_token;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const userId = decoded.userId;

    const stored = await getStoredRefreshToken(userId);
    if (stored === null) {
      // Token was revoked (logout) or never issued
      return res.status(401).json({ success: false, error: 'Refresh token has been revoked' });
    }
    if (stored !== token) {
      // Different token stored — possible reuse attack, invalidate everything
      await deleteRefreshToken(userId);
      return res.status(401).json({ success: false, error: 'Refresh token reuse detected' });
    }

    const userResult = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const accessToken  = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    await storeRefreshToken(userId, refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, refresh, setRedisClient };
