import { test, expect } from '@playwright/test'
import { loginAs, ensureTestUser } from './helpers.js'

test.beforeAll(async ({ request }) => { await ensureTestUser(request) })
test.beforeEach(async ({ page }) => { await loginAs(page) })

test('profile page shows user info', async ({ page }) => {
  await page.goto('/profile')
  await expect(page.locator('[data-testid="profile-page"]')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[data-testid="user-email"]')).toBeVisible({ timeout: 5000 })
})

test('can edit profile name', async ({ page }) => {
  await page.goto('/profile')
  await expect(page.locator('[data-testid="profile-page"]')).toBeVisible({ timeout: 10000 })
  await page.click('[data-testid="edit-profile-btn"]')
  await page.fill('[data-testid="name-input"]', 'Test User Updated')
  await page.click('[data-testid="save-profile-btn"]')
  await expect(page.locator('[data-testid="profile-page"]')).toBeVisible({ timeout: 5000 })
})
