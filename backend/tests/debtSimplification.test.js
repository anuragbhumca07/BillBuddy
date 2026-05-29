/**
 * Unit tests for the debt simplification algorithm.
 * These do not require a database connection.
 */

const { simplifyDebts } = require('../src/utils/debtSimplification');

describe('simplifyDebts', () => {
  it('returns empty array for no debts', () => {
    expect(simplifyDebts([])).toEqual([]);
    expect(simplifyDebts(null)).toEqual([]);
  });

  it('handles a simple two-person debt', () => {
    const debts = [{ from: 'alice', to: 'bob', amount: 50 }];
    const result = simplifyDebts(debts);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ from: 'alice', to: 'bob', amount: 50 });
  });

  it('cancels out mutual debts', () => {
    const debts = [
      { from: 'alice', to: 'bob',   amount: 50 },
      { from: 'bob',   to: 'alice', amount: 50 },
    ];
    const result = simplifyDebts(debts);
    expect(result).toHaveLength(0);
  });

  it('reduces three-way circular debt', () => {
    // alice -> bob $30, bob -> charlie $30, charlie -> alice $30
    // Net balances: all zero — no transactions needed
    const debts = [
      { from: 'alice',   to: 'bob',     amount: 30 },
      { from: 'bob',     to: 'charlie', amount: 30 },
      { from: 'charlie', to: 'alice',   amount: 30 },
    ];
    const result = simplifyDebts(debts);
    expect(result).toHaveLength(0);
  });

  it('minimizes transactions for a four-person group', () => {
    // Alice paid $120 for everyone (4 people), so each owes $30
    // Bob paid $60 for everyone (4 people), so each owes $15
    const debts = [
      { from: 'bob',     to: 'alice',   amount: 30 },
      { from: 'charlie', to: 'alice',   amount: 30 },
      { from: 'diana',   to: 'alice',   amount: 30 },
      { from: 'alice',   to: 'bob',     amount: 15 },
      { from: 'charlie', to: 'bob',     amount: 15 },
      { from: 'diana',   to: 'bob',     amount: 15 },
    ];
    const result = simplifyDebts(debts);
    // Total transactions should be <= number of participants - 1
    expect(result.length).toBeLessThanOrEqual(3);
    // Verify amounts balance out
    const netBalances = {};
    for (const t of result) {
      netBalances[t.from] = (netBalances[t.from] || 0) - t.amount;
      netBalances[t.to]   = (netBalances[t.to]   || 0) + t.amount;
    }
    // Original net balances
    const originalNet = {};
    for (const d of debts) {
      originalNet[d.from] = (originalNet[d.from] || 0) - d.amount;
      originalNet[d.to]   = (originalNet[d.to]   || 0) + d.amount;
    }
    for (const person of Object.keys(originalNet)) {
      expect(Math.abs((netBalances[person] || 0) - originalNet[person])).toBeLessThan(0.01);
    }
  });

  it('handles floating point amounts', () => {
    const debts = [
      { from: 'alice', to: 'bob', amount: 33.33 },
      { from: 'alice', to: 'bob', amount: 33.33 },
      { from: 'alice', to: 'bob', amount: 33.34 },
    ];
    const result = simplifyDebts(debts);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBeCloseTo(100, 2);
  });
});
