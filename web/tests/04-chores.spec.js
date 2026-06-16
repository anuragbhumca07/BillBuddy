import { test, expect } from '@playwright/test'
import { loginAs, ensureTestUser, ensureTestHouse } from './helpers.js'

test.beforeAll(async ({ request }) => {
  await ensureTestUser(request)
  await ensureTestHouse(request)
})
test.beforeEach(async ({ page }) => { await loginAs(page) })

test('chores page loads', async ({ page }) => {
  await page.goto('/chores')
  await expect(page.locator('[data-testid="chores-page"]')).toBeVisible({ timeout: 10000 })
})

test('add a chore', async ({ page }) => {
  await page.goto('/chores')
  await expect(page.locator('[data-testid="chores-page"]')).toBeVisible({ timeout: 10000 })
  await page.click('[data-testid="add-chore-btn"]')
  await expect(page.locator('[data-testid="chore-form"]')).toBeVisible({ timeout: 5000 })
  await page.fill('[data-testid="chore-title-input"]', `Clean kitchen ${Date.now()}`)
  await page.click('[data-testid="save-chore-btn"]')
  await expect(page.locator('[data-testid="chore-form"]')).not.toBeVisible({ timeout: 8000 })
})
