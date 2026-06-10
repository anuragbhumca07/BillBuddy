import { get } from '../helpers/apiHelper.js';

/**
 * Page Object for dashboard-related API calls.
 * Aggregates recent expenses, upcoming chores, and balances.
 */
export class DashboardPage {
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
   * Fetch recent expenses with optional limit.
   * @param {number} [limit=5]
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getRecentExpenses(limit = 5) {
    return get(
      this.request,
      `/houses/${this.houseId}/expenses?limit=${limit}`,
      this.token
    );
  }

  /**
   * Fetch upcoming chores (sorted by due date).
   * @param {number} [count=3]
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getUpcomingChores(count = 3) {
    return get(
      this.request,
      `/houses/${this.houseId}/chores?upcoming=${count}`,
      this.token
    );
  }

  /**
   * Fetch simplified balance totals for the house.
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getBalanceSummary() {
    return get(this.request, `/houses/${this.houseId}/expenses/balances`, this.token);
  }
}
