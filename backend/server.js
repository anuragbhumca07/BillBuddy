require('dotenv').config();

const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const { Server } = require('socket.io');
const { createClient } = require('redis');

const { pool }            = require('./src/models/db');
const socketService       = require('./src/services/socketService');
const { startCronJobs }   = require('./src/services/choreService');
const { setRedisClient }  = require('./src/controllers/authController');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { apiLimiter }      = require('./src/middleware/rateLimiter');
const { authenticate }    = require('./src/middleware/auth');

const authRoutes          = require('./src/routes/auth');
const userRoutes          = require('./src/routes/users');
const houseRoutes         = require('./src/routes/houses');
const expenseRoutes       = require('./src/routes/expenses');
const choreRoutes         = require('./src/routes/chores');
const announcementRoutes  = require('./src/routes/announcements');
const ruleRoutes          = require('./src/routes/rules');
const notificationRoutes  = require('./src/routes/notifications');

const app    = express();
const server = http.createServer(app);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(apiLimiter);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ success: false, error: 'Database unavailable' });
  }
});

// Middleware to infer houseId from user's current house membership.
// Enables house-agnostic routes for the mobile client.
const withUserHouse = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT house_id FROM house_members WHERE user_id = $1 ORDER BY joined_at ASC LIMIT 1',
      [req.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'You are not a member of any house' });
    }
    req.params.id = result.rows[0].house_id;
    req.houseId   = result.rows[0].house_id; // survives sub-router param merging
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Core API routes (note: no /api prefix — tests and mobile call without it) ─

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/notifications', notificationRoutes);

// House routes (includes /houses/mine, /houses/join, /houses/:id, etc.)
app.use('/houses', houseRoutes);

// House-scoped expense routes: /houses/:id/expenses, /houses/:id/balances
app.use('/houses/:id/expenses', expenseRoutes);

// House-scoped chore routes: /houses/:id/chores, /houses/:id/chores/history
app.use('/houses/:id/chores', choreRoutes);

// House-scoped announcement routes
app.use('/houses/:id/announcements', announcementRoutes);

// House-scoped rule routes
app.use('/houses/:id/rules', ruleRoutes);

// ─── Standalone routes (entity-id only, e.g. GET /expenses/:expenseId) ──────
// Also serve as user-context routes when mounted with withUserHouse:
// the middleware injects req.params.id (houseId) so list/create/balance
// endpoints work without explicit houseId in the URL (used by the mobile).
app.use('/expenses', authenticate, withUserHouse, expenseRoutes);
app.use('/chores', authenticate, withUserHouse, choreRoutes);
app.use('/announcements', authenticate, withUserHouse, announcementRoutes);
app.use('/rules', ruleRoutes);

// /houses/members and /houses/rules convenience routes are handled inside houseRoutes.

// ─── /api/* mirror routes (used by the web frontend in production) ───────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/houses', houseRoutes);
app.use('/api/houses/:id/expenses', expenseRoutes);
app.use('/api/houses/:id/chores', choreRoutes);
app.use('/api/houses/:id/announcements', announcementRoutes);
app.use('/api/houses/:id/rules', ruleRoutes);
app.use('/api/expenses', authenticate, withUserHouse, expenseRoutes);
app.use('/api/chores', authenticate, withUserHouse, choreRoutes);
app.use('/api/announcements', authenticate, withUserHouse, announcementRoutes);
app.use('/api/rules', ruleRoutes);

// ─── Serve web SPA in production ─────────────────────────────────────────────
const webDist = path.join(__dirname, '../web/dist');
if (require('fs').existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

// ─── 404 + Error handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
});
socketService.init(io);

// ─── Redis ────────────────────────────────────────────────────────────────────
const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.warn('[Redis] REDIS_URL not set — running without Redis');
    return;
  }
  try {
    const client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('[Redis] error:', err.message));
    await client.connect();
    console.log('[Redis] Connected');
    setRedisClient(client);
  } catch (err) {
    console.warn('[Redis] Connection failed — continuing without Redis:', err.message);
  }
};

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
const connectPostgres = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('[PostgreSQL] Connected');
  } catch (err) {
    console.error('[PostgreSQL] Connection failed:', err.message);
    process.exit(1);
  }
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const start = async () => {
  await connectPostgres();
  await connectRedis();
  if (process.env.NODE_ENV !== 'test') startCronJobs();
  const PORT = parseInt(process.env.PORT, 10) || 3000;
  server.listen(PORT, () => {
    console.log(`[Server] BillBuddy API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, server };
