import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage.js';
import { ExpensePage } from './pages/ExpensePage.js';
import { ChorePage } from './pages/ChorePage.js';
import { HousePage } from './pages/HousePage.js';
import { registerUser } from './helpers/authHelper.js';
import { uniqueUser, users, house } from './fixtures/testData.js';

/**
 * Dashboard data aggregation test suite.
 * Verifies recent expenses, upcoming chores (sorted by due date), and balance totals.
 */
test.describe('Dashboard Data', () => {
  const ts = Date.now();
  let aliceAuth;
  let bobAuth;
  let houseId;
  let dashboard;
  let aliceExpenses;
  let aliceChores;
  let apiContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext();

    aliceAuth = await registerUser(apiContext, uniqueUser(users.alice, ts));
    bobAuth = await registerUser(apiContext, uniqueUser(users.bob, ts));

    const aliceHousePage = new HousePage(apiContext, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `${house.name} Dashboard ${ts}`,
      address: house.address,
    });
    const houseBody = await houseResp.json();
    houseId = houseBody.house.id;
    const inviteCode = houseBody.house.invite_code;

    await new HousePage(apiContext, bobAuth.token).join(inviteCode);

    dashboard = new DashboardPage(apiContext, aliceAuth.token, houseId);
    aliceExpenses = new ExpensePage(apiContext, aliceAuth.token, houseId);
    aliceChores = new ChorePage(apiContext, aliceAuth.token, houseId);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('get recent expenses with limit', async () => {
    // Create 7 expenses so we can test the limit=5 behaviour
    const categories = ['Groceries', 'Utilities', 'Rent', 'Internet', 'Cleaning', 'Other', 'Groceries'];
    for (let i = 0; i < 7; i++) {
      await aliceExpenses.create({
        title: `Expense ${i + 1}`,
        amount: 10.00 + i,
        category: categories[i],
        paid_by: aliceAuth.user.id,
        date: new Date().toISOString().split('T')[0],
      });
    }

    const response = await dashboard.getRecentExpenses(5);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const expenses = body.expenses || body;
    expect(Array.isArray(expenses)).toBe(true);
    // Should return no more than 5
    expect(expenses.length).toBeLessThanOrEqual(5);
  });

  test('get upcoming chores sorted by due date', async () => {
    // Create 4 chores with different future due dates
    const today = new Date();
    const dueDates = [3, 7, 1, 14].map((daysFromNow) => {
      const d = new Date(today.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    });

    for (let i = 0; i < 4; i++) {
      await aliceChores.create({
        title: `Upcoming Chore ${i + 1}`,
        description: `Due in ${[3, 7, 1, 14][i]} days`,
        frequency: 'weekly',
        assigned_to: aliceAuth.user.id,
        due_date: dueDates[i],
      });
    }

    const response = await dashboard.getUpcomingChores(3);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const chores = body.chores || body;
    expect(Array.isArray(chores)).toBe(true);
    // Should return no more than 3
    expect(chores.length).toBeLessThanOrEqual(3);

    // Verify they are sorted by due date ascending
    for (let i = 0; i < chores.length - 1; i++) {
      const current = new Date(chores[i].due_date);
      const next = new Date(chores[i + 1].due_date);
      expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
    }
  });

  test('correct balance totals', async ({ request }) => {
    // Set up isolated house for clean balance testing
    const ts2 = Date.now() + 2000;
    const aliceAuth2 = await registerUser(request, uniqueUser(users.alice, ts2));
    const bobAuth2   = await registerUser(request, uniqueUser(users.bob, ts2));

    const aliceHousePage2 = new HousePage(request, aliceAuth2.token);
    const houseResp2 = await aliceHousePage2.create({
      name: `Balance Totals Dashboard ${ts2}`,
    });
    const houseBody2 = await houseResp2.json();
    const houseId2 = houseBody2.house.id;

    await new HousePage(request, bobAuth2.token).join(houseBody2.house.invite_code);

    const aliceExp2  = new ExpensePage(request, aliceAuth2.token, houseId2);
    const dashboard2 = new DashboardPage(request, aliceAuth2.token, houseId2);

    // Alice pays $80 (Bob owes $40)
    await aliceExp2.create({
      title: 'Internet Bill',
      amount: 80.00,
      category: 'Internet',
      paid_by: aliceAuth2.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    const balResp = await dashboard2.getBalanceSummary();
    expect(balResp.status()).toBe(200);

    const balBody = await balResp.json();
    const debts = balBody.debts || balBody.balances || balBody;
    expect(Array.isArray(debts)).toBe(true);

    // There should be exactly one debt: Bob owes Alice $40
    const debt = debts.find(
      (d) => d.from === bobAuth2.user.id && d.to === aliceAuth2.user.id
    );
    expect(debt).toBeDefined();
    expect(parseFloat(debt.amount)).toBeCloseTo(40.00, 2);
  });
});
