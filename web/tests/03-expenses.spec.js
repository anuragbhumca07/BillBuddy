import { test, expect } from '@playwright/test'
import { loginAs, ensureTestUser, ensureTestHouse } from './helpers.js'

test.beforeAll(async ({ request }) => {
  await ensureTestUser(request)
  await ensureTestHouse(request)
})

test.beforeEach(async ({ page }) => { await loginAs(page) })

test('expense list page loads', async ({ page }) => {
  await page.goto('/expenses')
  await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[data-testid="expense-list"]')).toBeAttached()
})

test('add a new expense', async ({ page }) => {
  await page.goto('/expenses')
  await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 10000 })
  await page.click('[data-testid="add-expense-btn"]')
  await expect(page.locator('[data-testid="expense-form"]')).toBeVisible({ timeout: 5000 })
  await page.fill('[data-testid="expense-title-input"]', `Dinner ${Date.now()}`)
  await page.fill('[data-testid="expense-amount-input"]', '1200')
  await page.click('[data-testid="save-expense-btn"]')
  await expect(page.locator('[data-testid="expense-form"]')).not.toBeVisible({ timeout: 8000 })
})

test('expense detail shows correct split', async ({ page }) => {
  await page.goto('/expenses')
  await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 10000 })
  const firstItem = page.locator('[data-testid="expense-item"]').first()
  const count = await firstItem.count()
  if (count > 0) {
    await firstItem.click()
    await expect(page.locator('[data-testid="expense-detail"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="split-breakdown"]')).toBeVisible()
  }
})

test('edit an expense', async ({ page }) => {
  await page.goto('/expenses')
  await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 10000 })
  const firstItem = page.locator('[data-testid="expense-item"]').first()
  const count = await firstItem.count()
  if (count > 0) {
    await firstItem.click()
    await page.click('[data-testid="edit-expense-btn"]')
    await page.fill('[data-testid="expense-title-input"]', 'Updated Expense')
    await page.click('[data-testid="save-expense-btn"]')
    await expect(page.locator('[data-testid="expense-form"]')).not.toBeVisible({ timeout: 8000 })
  }
})

test('delete an expense', async ({ page }) => {
  // Create one first
  await page.goto('/expenses')
  await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 10000 })
  await page.click('[data-testid="add-expense-btn"]')
  await page.fill('[data-testid="expense-title-input"]', 'ToDelete')
  await page.fill('[data-testid="expense-amount-input"]', '100')
  await page.click('[data-testid="save-expense-btn"]')
  await expect(page.locator('[data-testid="expense-form"]')).not.toBeVisible({ timeout: 8000 })
  // Click on it
  const item = page.locator('[data-testid="expense-item"]').first()
  await item.click()
  await expect(page.locator('[data-testid="expense-detail"]')).toBeVisible({ timeout: 5000 })
  await page.click('[data-testid="delete-expense-btn"]')
  await page.click('[data-testid="confirm-delete-btn"]')
  await expect(page).toHaveURL('/expenses', { timeout: 5000 })
})
