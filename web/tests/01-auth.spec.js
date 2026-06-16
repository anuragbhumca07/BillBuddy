import { test, expect } from '@playwright/test'
import { TEST_USER, loginAs, ensureTestUser } from './helpers.js'

test.beforeAll(async ({ request }) => {
  await ensureTestUser(request)
})

test('login with valid credentials', async ({ page }) => {
  await loginAs(page)
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 8000 })
})

test('login with invalid password shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', TEST_USER.email)
  await page.fill('[data-testid="password-input"]', 'wrongpassword')
  await page.click('[data-testid="login-btn"]')
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 })
})

test('logout clears session and redirects to login', async ({ page }) => {
  await loginAs(page)
  // Navigate to profile where logout-btn is always visible (sidebar hidden on mobile)
  await page.goto('/profile')
  await expect(page.locator('[data-testid="profile-page"]')).toBeVisible({ timeout: 8000 })
  await page.locator('[data-testid="profile-page"] [data-testid="logout-btn"]').click()
  await expect(page).toHaveURL('/login')
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
})

test('protected routes redirect unauthenticated users', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
})

test('register new user', async ({ page }) => {
  await page.goto('/register')
  const unique = `user_${Date.now()}`
  await page.fill('[data-testid="name-input"]', 'New User')
  await page.fill('[data-testid="email-input"]', `${unique}@test.com`)
  await page.fill('[data-testid="password-input"]', 'NewPass123!')
  await page.fill('[data-testid="confirm-password-input"]', 'NewPass123!')
  await page.click('[data-testid="register-btn"]')
  await expect(page).toHaveURL(/login|dashboard/, { timeout: 8000 })
})
