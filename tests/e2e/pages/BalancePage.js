import { get, post } from '../helpers/apiHelper.js';

/**
 * Page Object for balance and debt-simplification API calls.
 */
export class BalancePage {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} token - Bearer access token
   * @param {string} houseId - House UUID
   */
  constructor(request, token, houseId) {
    this.request = request;
    this.token = token;
    this.houseId = houseId;
  }

  /**
   * Get simplified balances / debts for the house.
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getBalances() {
    return get(this.request, `/houses/${this.houseId}/expenses/balances`, this.token);
  }

  /**
   * Settle a specific expense split (the authenticated user's own split).
   * @param {string} expenseId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async settleExpense(expenseId) {
    return post(this.request, `/expenses/${expenseId}/settle`, {}, this.token);
  }
}
