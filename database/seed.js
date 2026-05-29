#!/usr/bin/env node
/**
 * BillBuddy Database Seeder
 *
 * Runs all SQL migration files in order against the configured PostgreSQL database.
 *
 * Usage:
 *   DATABASE_URL=postgresql://billbuddy:billbuddy123@localhost:5432/billbuddy node database/seed.js
 *
 * Or with docker-compose running:
 *   docker-compose exec backend node /app/../database/seed.js
 *
 * Environment variables:
 *   DATABASE_URL  — Full PostgreSQL connection string (required)
 */

'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('\n  ERROR: DATABASE_URL environment variable is not set.\n');
  console.error('  Example:');
  console.error(
    '    DATABASE_URL=postgresql://billbuddy:billbuddy123@localhost:5432/billbuddy node database/seed.js\n'
  );
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[seed] ${msg}`);
}

function logOk(msg) {
  console.log(`[seed]   ✓ ${msg}`);
}

function logErr(msg) {
  console.error(`[seed]   ✗ ${msg}`);
}

// ─── Migration runner ────────────────────────────────────────────────────────

async function runMigrations(client) {
  const migrationsDir = path.join(__dirname, 'migrations');

  // Collect and sort migration files
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    log('No migration files found in ./database/migrations/');
    return;
  }

  log(`Found ${files.length} migration file(s):`);
  files.forEach((f) => log(`  • ${f}`));

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    log(`Running migration: ${file} …`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      logOk(`${file} applied successfully.`);
    } catch (err) {
      await client.query('ROLLBACK');
      logErr(`Failed to apply ${file}:`);
      logErr(err.message);
      throw err;
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  log('BillBuddy Database Seeder');
  log('─'.repeat(50));
  log(`Connecting to: ${DATABASE_URL.replace(/:([^:@]+)@/, ':****@')}`);

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    logOk('Connected to PostgreSQL.');

    // Verify connection
    const { rows } = await client.query('SELECT current_database() AS db, version()');
    log(`Database: ${rows[0].db}`);
    log(`Server:   ${rows[0].version.split(',')[0]}`);
    log('─'.repeat(50));

    await runMigrations(client);

    log('─'.repeat(50));
    log('All migrations completed successfully.');

    // Quick summary query
    const tables = [
      'users',
      'houses',
      'house_members',
      'expenses',
      'expense_splits',
      'chores',
      'chore_history',
      'announcements',
      'house_rules',
      'notifications',
    ];

    log('\nRow counts after seeding:');
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) AS n FROM ${table}`);
        const count = String(res.rows[0].n).padStart(4);
        log(`  ${count}  ${table}`);
      } catch {
        log(`  ----  ${table} (table not found)`);
      }
    }
    log('');
  } catch (err) {
    logErr('Seeding failed: ' + err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
