import { test, expect } from '@playwright/test'
import { loginAs, ensureTestUser } from './helpers.js'

test.beforeAll(async ({ request }) => { await ensureTestUser(request) })
test.beforeEach(async ({ page }) => { await loginAs(page) })

test('dashboard loads with key elements', async ({ page }) => {
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
  await expect(page.locator('[data-testid="add-expense-btn"]')).toBeVisible()
})

test('add expense button opens modal', async ({ page }) => {
  await page.click('[data-testid="add-expense-btn"]')
  await expect(page.locator('[data-testid="expense-form"]')).toBeVisible()
})
