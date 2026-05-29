import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { uniqueUser, users } from './fixtures/testData.js';

/**
 * Authentication test suite.
 * Tests registration, login, token refresh, and logout flows.
 */
test.describe('Authentication', () => {
  // Use a single timestamp so all auth tests share unique but consistent emails
  const ts = Date.now();
  const alice = uniqueUser(users.alice, ts);

  test('should register a new user successfully', async ({ request }) => {
    const page = new LoginPage(request);
    const response = await page.register(alice.name, alice.email, alice.password);

    expect(response.status()).toBe(201);

    const body = await response.json();
    // Token fields
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    // User object
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe(alice.email);
    expect(body.user.name).toBe(alice.name);
    // Password should never be returned
    expect(body.user).not.toHaveProperty('password');
    expect(body.user).not.toHaveProperty('password_hash');
  });

  test('should fail registration with duplicate email', async ({ request }) => {
    const page = new LoginPage(request);
    const dupUser = uniqueUser(users.bob, ts + 1);

    // First registration succeeds
    const first = await page.register(dupUser.name, dupUser.email, dupUser.password);
    expect(first.status()).toBe(201);

    // Second registration with same email must fail
    const second = await page.register(dupUser.name, dupUser.email, dupUser.password);
    expect(second.status()).toBe(400);

    const body = await second.json();
    expect(body.success).toBe(false);
    // Error message should mention the duplicate / already exists
    expect(body.error || body.message || JSON.stringify(body)).toMatch(/already|exist|duplicate/i);
  });

  test('should login with valid credentials', async ({ request }) => {
    const page = new LoginPage(request);
    // Register first, then login
    const loginUser = uniqueUser(users.carol, ts + 2);
    await page.register(loginUser.name, loginUser.email, loginUser.password);

    const response = await page.login(loginUser.email, loginUser.password);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
    expect(body.user.email).toBe(loginUser.email);
  });

  test('should fail login with wrong password', async ({ request }) => {
    const page = new LoginPage(request);
    // Register a user to attempt login against
    const badPassUser = uniqueUser(users.alice, ts + 3);
    await page.register(badPassUser.name, badPassUser.email, badPassUser.password);

    const response = await page.login(badPassUser.email, 'wrongpassword!');
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('should refresh access token', async ({ request }) => {
    const page = new LoginPage(request);
    const refreshUser = uniqueUser(users.bob, ts + 4);
    await page.register(refreshUser.name, refreshUser.email, refreshUser.password);

    const loginResp = await page.login(refreshUser.email, refreshUser.password);
    const loginBody = await loginResp.json();
    const { refreshToken } = loginBody;

    expect(typeof refreshToken).toBe('string');

    const refreshResp = await page.refresh(refreshToken);
    expect(refreshResp.status()).toBe(200);

    const refreshBody = await refreshResp.json();
    expect(refreshBody).toHaveProperty('accessToken');
    // The new access token should be a non-empty string
    expect(typeof refreshBody.accessToken).toBe('string');
    expect(refreshBody.accessToken.length).toBeGreaterThan(10);
  });

  test('should logout and invalidate refresh token', async ({ request }) => {
    const page = new LoginPage(request);
    const logoutUser = uniqueUser(users.carol, ts + 5);
    await page.register(logoutUser.name, logoutUser.email, logoutUser.password);

    const loginResp = await page.login(logoutUser.email, logoutUser.password);
    const loginBody = await loginResp.json();
    const { accessToken, refreshToken } = loginBody;

    // Logout
    const logoutResp = await page.logout(accessToken, refreshToken);
    expect([200, 204]).toContain(logoutResp.status());

    // Attempting to refresh after logout should fail
    const refreshResp = await page.refresh(refreshToken);
    expect(refreshResp.status()).toBeGreaterThanOrEqual(400);

    const refreshBody = await refreshResp.json();
    expect(refreshBody.success).toBe(false);
  });
});
