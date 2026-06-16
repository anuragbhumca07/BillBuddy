export const TEST_USER = {
  email: 'testbillbuddy@test.com',
  password: 'TestPass123!',
  name: 'Test User',
}

export const API = 'http://localhost:3000'

export async function loginAs(page, user = TEST_USER) {
  await page.goto('/login')
  await page.fill('[data-testid="email-input"]', user.email)
  await page.fill('[data-testid="password-input"]', user.password)
  await page.click('[data-testid="login-btn"]')
  await page.waitForURL('/dashboard', { timeout: 15000 })
  // Wait for auth state to settle
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
}

export async function ensureTestUser(request) {
  await request.post(`${API}/auth/register`, { data: TEST_USER }).catch(() => {})
}

export async function ensureTestHouse(request) {
  // Get auth token first
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  }).catch(() => null)
  if (!loginRes) return

  const body = await loginRes.json().catch(() => null)
  if (!body?.accessToken) return

  const headers = { Authorization: `Bearer ${body.accessToken}` }

  // Check if user already has a house
  const houseRes = await request.get(`${API}/houses/mine`, { headers }).catch(() => null)
  if (houseRes?.ok()) return

  // Create a test house
  await request.post(`${API}/houses`, {
    headers,
    data: { name: 'Test House', address: '123 Test St' },
  }).catch(() => {})
}
