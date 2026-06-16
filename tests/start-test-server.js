/**
 * Starts embedded PostgreSQL, runs schema migrations, then starts the
 * Express backend on port 3000 for Playwright API tests.
 * Usage: node start-test-server.js
 */
const { default: EmbeddedPostgres } = require('embedded-postgres');
const { Client } = require('pg');
const fs   = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PG_PORT       = 5434;
const DB_NAME       = 'billbuddy';
const DB_USER       = 'billbuddy';
const DB_PASS       = 'billbuddy123';
const MIGRATION_SQL = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
const BACKEND_DIR   = path.join(__dirname, '../backend');
const PG_DATA_DIR   = path.join(__dirname, '.embedded-pg-data');

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForPort(port, retries = 20, delayMs = 500) {
  const net = require('net');
  for (let i = 0; i < retries; i++) {
    await new Promise((resolve) => {
      const s = net.createConnection(port, '127.0.0.1');
      s.on('connect', () => { s.destroy(); resolve(true); });
      s.on('error',   () => { s.destroy(); resolve(false); });
    }).then((ok) => {
      if (ok) return;
    });
    if (i < retries - 1) await sleep(delayMs);
  }
}

async function runMigrations(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const sql = fs.readFileSync(MIGRATION_SQL, 'utf8');
    await client.query(sql);
    console.log('[Setup] Schema migrations applied.');
  } finally {
    await client.end();
  }
}

let pg;
let backend;

async function shutdown() {
  if (backend && !backend.killed) {
    backend.kill();
    await sleep(500);
  }
  if (pg) {
    try { await pg.stop(); } catch (_) {}
  }
}

async function main() {
  // ── 1. Start embedded PostgreSQL ──────────────────────────────────────────
  pg = new EmbeddedPostgres({
    databaseDir: PG_DATA_DIR,
    user:        'postgres',
    password:    'postgres',
    port:        PG_PORT,
    persistent:  false,
  });

  // Clean up stale data directory so initdb doesn't fail
  if (fs.existsSync(PG_DATA_DIR)) {
    fs.rmSync(PG_DATA_DIR, { recursive: true, force: true });
  }

  console.log('[Setup] Initializing embedded PostgreSQL...');
  await pg.initialise();
  await pg.start();
  console.log(`[Setup] PostgreSQL running on port ${PG_PORT}`);

  // ── 2. Create application database + user ─────────────────────────────────
  const adminConn = `postgresql://postgres:postgres@localhost:${PG_PORT}/postgres`;
  const admin = new Client({ connectionString: adminConn });
  await admin.connect();
  await admin.query(`CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}' CREATEDB`).catch(() => {});
  await admin.query(`CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}`).catch(() => {});
  await admin.end();

  // ── 3. Run migrations ──────────────────────────────────────────────────────
  const appConn = `postgresql://${DB_USER}:${DB_PASS}@localhost:${PG_PORT}/${DB_NAME}`;
  await runMigrations(appConn);

  // ── 4. Start backend ───────────────────────────────────────────────────────
  const env = {
    ...process.env,
    PORT:                 '3000',
    NODE_ENV:             'test',
    DATABASE_URL:         appConn,
    JWT_SECRET:           'test-jwt-secret-billbuddy',
    JWT_REFRESH_SECRET:   'test-refresh-secret-billbuddy',
    // No Redis in test mode
  };

  backend = spawn('node', ['server.js'], {
    cwd:   BACKEND_DIR,
    env,
    stdio: 'inherit',
  });

  console.log(`[Setup] Backend process started (PID ${backend.pid})`);

  await waitForPort(3000);
  console.log('[Setup] Backend is ready on port 3000.');

  // ── Cleanup handlers ───────────────────────────────────────────────────────
  const onExit = async () => {
    await shutdown();
    process.exit(0);
  };
  process.on('SIGTERM', onExit);
  process.on('SIGINT',  onExit);

  backend.on('exit', async (code) => {
    console.log('[Setup] Backend exited with code', code);
    await shutdown();
    process.exit(code ?? 0);
  });
}

main().catch(async (err) => {
  console.error('[Setup] Fatal:', err.message);
  await shutdown().catch(() => {});
  process.exit(1);
});
