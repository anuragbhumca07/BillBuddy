import { test, expect, devices } from '@playwright/test'
import { loginAs, ensureTestUser, ensureTestHouse } from './helpers.js'

test.use({ ...devices['Pixel 7'] })

test.beforeAll(async ({ request }) => {
  await ensureTestUser(request)
  await ensureTestHouse(request)
})

test.beforeEach(async ({ page }) => { await loginAs(page) })

test('bottom nav visible on mobile', async ({ page }) => {
  await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible({ timeout: 8000 })
})

test('sidebar hidden on mobile', async ({ page }) => {
  await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible()
})

test('expense form accessible on mobile', async ({ page }) => {
  await page.goto('/expenses')
  await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 10000 })
  await page.click('[data-testid="add-expense-btn"]')
  await expect(page.locator('[data-testid="expense-form"]')).toBeVisible({ timeout: 5000 })
})
