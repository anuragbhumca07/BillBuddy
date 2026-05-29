/**
 * Auth endpoint tests (placeholder).
 *
 * These tests require a running PostgreSQL instance.
 * Set TEST_DATABASE_URL in your environment before running.
 *
 * Run: npm test
 */

const request = require('supertest');

// Lazy-import so DB connection isn't established until the test runs
let app;

beforeAll(() => {
  process.env.NODE_ENV    = 'test';
  process.env.JWT_SECRET  = 'test-jwt-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  // Use test DB if set; otherwise skip integration tests
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
});

describe('Auth endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should return 400 when required fields are missing', async () => {
      if (!process.env.TEST_DATABASE_URL) return;

      ({ app } = require('../server'));
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'notvalid' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 when email is missing', async () => {
      if (!process.env.TEST_DATABASE_URL) return;

      ({ app } = require('../server'));
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'somepassword' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Health check', () => {
    it('GET /health responds', async () => {
      if (!process.env.TEST_DATABASE_URL) {
        // Skip without DB
        return;
      }
      ({ app } = require('../server'));
      const res = await request(app).get('/health');
      expect([200, 503]).toContain(res.statusCode);
    });
  });
});
