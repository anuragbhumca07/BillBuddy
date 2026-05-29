import { test, expect } from '@playwright/test';
import { BalancePage } from './pages/BalancePage.js';
import { ExpensePage } from './pages/ExpensePage.js';
import { HousePage } from './pages/HousePage.js';
import { registerUser } from './helpers/authHelper.js';
import { uniqueUser, users, house } from './fixtures/testData.js';

/**
 * Debt Simplification and Balance test suite.
 * Verifies that multi-person debts are simplified to minimum transactions.
 */
test.describe('Debt Simplification', () => {

  test('simplify debts with 3+ users', async ({ request }) => {
    const ts = Date.now();
    // Register three users
    const aliceAuth = await registerUser(request, uniqueUser(users.alice, ts));
    const bobAuth = await registerUser(request, uniqueUser(users.bob, ts));
    const carolAuth = await registerUser(request, uniqueUser(users.carol, ts));

    // Alice creates the house
    const aliceHousePage = new HousePage(request, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `${house.name} Balances ${ts}`,
      address: house.address,
    });
    const houseBody = await houseResp.json();
    const houseId = houseBody.house.id;
    const inviteCode = houseBody.house.invite_code;

    // Bob and Carol join
    await new HousePage(request, bobAuth.token).join(inviteCode);
    await new HousePage(request, carolAuth.token).join(inviteCode);

    const aliceExp = new ExpensePage(request, aliceAuth.token, houseId);
    const bobExp = new ExpensePage(request, bobAuth.token, houseId);

    // Alice pays $90 for Groceries — split 3 ways → each owes $30 to Alice
    // (Alice gets back $60 net, Bob and Carol each owe $30)
    await aliceExp.create({
      title: 'Monthly Groceries',
      amount: 90.00,
      category: 'Groceries',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    // Bob pays $60 for Utilities — split 3 ways → each owes $20 to Bob
    // (Bob gets back $40 net, Alice and Carol each owe $20)
    await bobExp.create({
      title: 'Utilities',
      amount: 60.00,
      category: 'Utilities',
      paid_by: bobAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });

    // Net positions:
    // Alice: paid $90, owes $20 to Bob → net owed to Alice = $90 - $30 - $20 = $40 (creditor)
    // Bob:   paid $60, owes $30 to Alice → net owed to Bob = $60 - $20 - $20 = $20 (creditor)
    // Carol: paid $0, owes $30 to Alice + $20 to Bob = -$50 (debtor)
    //
    // Simplified minimum transactions:
    // Carol → Alice: $40
    // Carol → Bob:   $10
    // (or similar minimized set)

    const balResp = await aliceExp.getBalances();
    expect(balResp.status()).toBe(200);

    const balBody = await balResp.json();
    const debts = balBody.debts || balBody.balances || balBody;

    expect(Array.isArray(debts)).toBe(true);
    // Total debt should be conserved
    const totalDebt = debts.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    // Total owed across all transactions = $50 (Carol owes $30+$20=$50 total)
    expect(totalDebt).toBeCloseTo(50.00, 1);

    // With 3 people, simplification should yield at most 2 transactions
    // (n-1 maximum for n people in a simplified graph)
    expect(debts.length).toBeLessThanOrEqual(2);

    // Every debtor in the simplified list must be Carol
    // Every creditor in the simplified list must be Alice or Bob
    for (const debt of debts) {
      expect(debt.from).toBe(carolAuth.user.id);
      expect([aliceAuth.user.id, bobAuth.user.id]).toContain(debt.to);
    }
  });

  test('balances update after settlement', async ({ request }) => {
    const ts = Date.now() + 5000;
    const aliceAuth = await registerUser(request, uniqueUser(users.alice, ts));
    const bobAuth = await registerUser(request, uniqueUser(users.bob, ts));

    // Create house
    const aliceHousePage = new HousePage(request, aliceAuth.token);
    const houseResp = await aliceHousePage.create({
      name: `Balance Settlement Test ${ts}`,
    });
    const houseBody = await houseResp.json();
    const houseId = houseBody.house.id;

    await new HousePage(request, bobAuth.token).join(houseBody.house.invite_code);

    const aliceExp = new ExpensePage(request, aliceAuth.token, houseId);
    const bobBalance = new BalancePage(request, bobAuth.token, houseId);

    // Alice pays $50 (equal split → Bob owes $25)
    const createResp = await aliceExp.create({
      title: 'Coffee Run',
      amount: 50.00,
      category: 'Groceries',
      paid_by: aliceAuth.user.id,
      date: new Date().toISOString().split('T')[0],
    });
    const createBody = await createResp.json();
    const expenseId = createBody.expense.id;

    // Verify Bob has a debt before settlement
    const beforeResp = await bobBalance.getBalances();
    const beforeBody = await beforeResp.json();
    const beforeDebts = beforeBody.debts || beforeBody.balances || beforeBody;
    expect(Array.isArray(beforeDebts)).toBe(true);

    const debtBefore = beforeDebts.find(
      (d) => d.from === bobAuth.user.id && d.to === aliceAuth.user.id
    );
    expect(debtBefore).toBeDefined();
    expect(parseFloat(debtBefore.amount)).toBeCloseTo(25.00, 2);

    // Bob settles the expense
    const settleResp = await bobBalance.settleExpense(expenseId);
    expect([200, 204]).toContain(settleResp.status());

    // After settlement, Bob's debt to Alice for this expense should be zero
    const afterResp = await bobBalance.getBalances();
    const afterBody = await afterResp.json();
    const afterDebts = afterBody.debts || afterBody.balances || afterBody;
    expect(Array.isArray(afterDebts)).toBe(true);

    const debtAfter = afterDebts.find(
      (d) => d.from === bobAuth.user.id && d.to === aliceAuth.user.id
    );
    // Either no entry (fully settled) or amount is 0
    if (debtAfter) {
      expect(parseFloat(debtAfter.amount)).toBeCloseTo(0.00, 2);
    } else {
      // No debt entry means it was fully cleared — this is correct
      expect(debtAfter).toBeUndefined();
    }
  });
});
