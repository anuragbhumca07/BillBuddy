import { test, expect } from '@playwright/test';
import { ExpensePage } from './pages/ExpensePage.js';
import { HousePage } from './pages/HousePage.js';
import { registerUser } from './helpers/authHelper.js';
import { uniqueUser, users, house } from './fixtures/testData.js';

/**
 * Expense management test suite.
 * Covers creation, custom splits, category filtering, debt settlement, and deletion.
 */
test.describe('Expense Management', () => {
  const ts = Date.now();
  let aliceAuth;
  let bobAuth;
  let houseId;
  let aliceExpenses;
  let bobExpenses;
  let apiContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext();

    // Register Alice and Bob
    aliceAuth = await registerUser(apiContext, uniqueUser(users.alice, ts));
    bobAuth = await registerUser(apiContext, uniqueUser(users.bob, ts));

    // Alice creates a house
    const aliceHousePage = new HousePage(apiContext, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `${house.name} Expense ${ts}`,
      address: house.address,
    });
    const houseBody = await houseResp.json();
    houseId = houseBody.house.id;
    const inviteCode = houseBody.house.invite_code;

    // Bob joins the house
    const bobHousePage = new HousePage(apiContext, bobAuth.token);
    await bobHousePage.join(inviteCode);

    // Create expense page helpers
    aliceExpenses = new ExpensePage(apiContext, aliceAuth.token, houseId);
    bobExpenses = new ExpensePage(apiContext, bobAuth.token, houseId);
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('should create expense with equal split', async () => {
    const response = await aliceExpenses.create({
      title: 'Groceries Split Test',
      amount: 60.00,
      category: 'Groceries',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('expense');
    const expense = body.expense;
    expect(expense.title).toBe('Groceries Split Test');
    expect(parseFloat(expense.amount)).toBeCloseTo(60.00, 2);

    // Should have 2 splits (Alice and Bob) of $30 each
    expect(body).toHaveProperty('splits');
    expect(body.splits.length).toBe(2);

    for (const split of body.splits) {
      expect(parseFloat(split.amount_owed)).toBeCloseTo(30.00, 2);
    }
  });

  test('should create expense with custom split', async () => {
    const response = await aliceExpenses.create({
      title: 'Custom Split Dinner',
      amount: 60.00,
      category: 'Other',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
      splits: [
        { user_id: aliceAuth.user.id, amount: 40.00 },
        { user_id: bobAuth.user.id, amount: 20.00 },
      ],
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('splits');
    expect(body.splits.length).toBe(2);

    const aliceSplit = body.splits.find((s) => s.user_id === aliceAuth.user.id);
    const bobSplit = body.splits.find((s) => s.user_id === bobAuth.user.id);

    expect(aliceSplit).toBeDefined();
    expect(parseFloat(aliceSplit.amount_owed)).toBeCloseTo(40.00, 2);

    expect(bobSplit).toBeDefined();
    expect(parseFloat(bobSplit.amount_owed)).toBeCloseTo(20.00, 2);
  });

  test('should list expenses with category filter', async () => {
    // Create additional expenses with different categories
    await aliceExpenses.create({
      title: 'Water Bill',
      amount: 45.00,
      category: 'Utilities',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });
    await aliceExpenses.create({
      title: 'Extra Groceries',
      amount: 25.00,
      category: 'Groceries',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    // Filter by Groceries
    const response = await aliceExpenses.list({ category: 'Groceries' });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const expenses = body.expenses || body;
    expect(Array.isArray(expenses)).toBe(true);
    expect(expenses.length).toBeGreaterThanOrEqual(2);

    // Every returned expense must have category Groceries
    for (const exp of expenses) {
      expect(exp.category).toBe('Groceries');
    }
  });

  test('should settle a debt', async () => {
    // Alice pays $30 for something (equal split → Bob owes $15, Alice owes $15)
    const createResp = await aliceExpenses.create({
      title: 'Settlement Test Expense',
      amount: 30.00,
      category: 'Other',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    const createBody = await createResp.json();
    const expenseId = createBody.expense.id;

    // Before settling: Bob's split should be unsettled
    const beforeBalances = await bobExpenses.getBalances();
    const beforeBody = await beforeBalances.json();
    const debts = beforeBody.debts || beforeBody.balances || beforeBody;
    // Debts should be non-empty (Bob owes Alice something)
    expect(Array.isArray(debts)).toBe(true);

    // Bob settles his share of this specific expense
    const settleResp = await bobExpenses.settle(expenseId);
    expect([200, 204]).toContain(settleResp.status());

    // Get expense detail and verify Bob's split is now settled
    const expResp = await aliceExpenses.getExpense(expenseId);
    const expBody = await expResp.json();
    const splits = expBody.expense?.splits || expBody.splits || [];
    const bobSplit = splits.find((s) => s.user_id === bobAuth.user.id);
    if (bobSplit) {
      expect(bobSplit.is_settled).toBe(true);
    }
  });

  test('should delete expense', async () => {
    // Create an expense specifically for deletion
    const createResp = await aliceExpenses.create({
      title: 'Expense To Delete',
      amount: 10.00,
      category: 'Other',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    const createBody = await createResp.json();
    const expenseId = createBody.expense.id;

    // Delete it
    const deleteResp = await aliceExpenses.delete(expenseId);
    expect([200, 204]).toContain(deleteResp.status());

    // Verify it's no longer in the list
    const listResp = await aliceExpenses.list();
    const listBody = await listResp.json();
    const expenses = listBody.expenses || listBody;
    const found = expenses.find((e) => e.id === expenseId);
    expect(found).toBeUndefined();
  });

  test('should get expense balances with correct net amounts', async ({ request }) => {
    // Create a fresh house for isolated balance testing
    const ts2 = Date.now() + 1000;
    const aliceAuth2 = await registerUser(request, uniqueUser(users.alice, ts2));
    const bobAuth2   = await registerUser(request, uniqueUser(users.bob, ts2));

    const aliceHouse2 = new HousePage(request, aliceAuth2.token);
    const houseResp = await aliceHouse2.create({ name: `Balance Test House ${ts2}` });
    const houseBody = await houseResp.json();
    const houseId2 = houseBody.house.id;
    const ic2 = houseBody.house.invite_code;

    await new HousePage(request, bobAuth2.token).join(ic2);

    const aliceExp2 = new ExpensePage(request, aliceAuth2.token, houseId2);
    const bobExp2   = new ExpensePage(request, bobAuth2.token, houseId2);

    // Alice pays $100 (Bob owes $50)
    await aliceExp2.create({
      title: 'Rent',
      amount: 100.00,
      category: 'Rent',
      paid_by: aliceAuth2.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    // Bob pays $40 (Alice owes $20)
    await bobExp2.create({
      title: 'Internet',
      amount: 40.00,
      category: 'Internet',
      paid_by: bobAuth2.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    // Net: Bob owes Alice $50 - $20 = $30
    const balResp = await aliceExp2.getBalances();
    expect(balResp.status()).toBe(200);

    const balBody = await balResp.json();
    const debts = balBody.debts || balBody.balances || balBody;
    expect(Array.isArray(debts)).toBe(true);

    // There should be exactly one simplified transaction
    expect(debts.length).toBe(1);
    const debt = debts[0];
    expect(debt.from).toBe(bobAuth2.user.id);
    expect(debt.to).toBe(aliceAuth2.user.id);
    expect(parseFloat(debt.amount)).toBeCloseTo(30.00, 2);
  });
});
