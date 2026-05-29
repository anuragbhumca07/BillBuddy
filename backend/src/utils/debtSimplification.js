/**
 * Debt Simplification — Greedy Min-Transactions Algorithm
 *
 * Given a list of raw debts {from, to, amount}, compute each person's
 * net balance, then use a two-pointer / max-heap-style greedy approach
 * to produce the minimum number of transactions required to settle all debts.
 *
 * Time complexity: O(n^2) where n = number of distinct participants.
 */

/**
 * Simplify a list of debts into the minimum number of transactions.
 *
 * @param {Array<{from: string, to: string, amount: number}>} debts
 * @returns {Array<{from: string, to: string, amount: number}>}
 */
const simplifyDebts = (debts) => {
  if (!debts || debts.length === 0) return [];

  // Step 1: compute net balance for each person
  // Positive balance  → person is owed money (creditor)
  // Negative balance  → person owes money (debtor)
  const balanceMap = {};

  for (const debt of debts) {
    if (typeof debt.amount !== 'number' || debt.amount <= 0) continue;

    balanceMap[debt.from] = (balanceMap[debt.from] || 0) - debt.amount;
    balanceMap[debt.to]   = (balanceMap[debt.to]   || 0) + debt.amount;
  }

  // Step 2: split into creditors and debtors (ignore zero balances)
  const creditors = []; // { id, amount }  — amount > 0
  const debtors   = []; // { id, amount }  — amount > 0 (absolute value)

  for (const [id, balance] of Object.entries(balanceMap)) {
    const rounded = Math.round(balance * 100) / 100; // avoid float drift
    if (rounded > 0)  creditors.push({ id, amount: rounded });
    if (rounded < 0)  debtors.push({ id, amount: -rounded });
  }

  // Sort descending so largest amounts are settled first (greedy)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let ci = 0; // creditor pointer
  let di = 0; // debtor pointer

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor   = debtors[di];

    const settleAmount = Math.min(creditor.amount, debtor.amount);
    const rounded = Math.round(settleAmount * 100) / 100;

    if (rounded > 0) {
      transactions.push({
        from:   debtor.id,
        to:     creditor.id,
        amount: rounded,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount   -= settleAmount;

    // Advance pointer whose balance is now zero
    if (Math.abs(creditor.amount) < 0.001) ci++;
    if (Math.abs(debtor.amount)   < 0.001) di++;
  }

  return transactions;
};

/**
 * Build a human-readable summary from simplified debts.
 *
 * @param {Array<{from: string, to: string, amount: number}>} simplified
 * @param {Object} userMap  — { userId: displayName }
 * @returns {Array<{from: string, to: string, amount: number, description: string}>}
 */
const buildDebtSummary = (simplified, userMap = {}) => {
  return simplified.map((t) => ({
    ...t,
    description: `${userMap[t.from] || t.from} owes ${userMap[t.to] || t.to} $${t.amount.toFixed(2)}`,
  }));
};

module.exports = { simplifyDebts, buildDebtSummary };
