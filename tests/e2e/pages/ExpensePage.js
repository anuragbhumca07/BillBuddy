import { post, get, del } from '../helpers/apiHelper.js';

/**
 * Page Object for expense management API calls.
 */
export class ExpensePage {
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
   * Create a new expense in the house.
   * @param {Object} expenseData
   * @param {string} expenseData.title
   * @param {number} expenseData.amount
   * @param {string} [expenseData.category]
   * @param {string} [expenseData.date] - ISO date string
   * @param {Array<{user_id: string, amount: number}>} [expenseData.splits]
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async create(expenseData) {
    return post(
      this.request,
      `/houses/${this.houseId}/expenses`,
      expenseData,
      this.token
    );
  }

  /**
   * List expenses for the house, with optional filter query params.
   * @param {Object} [filters] - e.g. { category: 'Groceries', limit: 5 }
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async list(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const path = `/houses/${this.houseId}/expenses${params ? `?${params}` : ''}`;
    return get(this.request, path, this.token);
  }

  /**
   * Get a single expense by ID.
   * @param {string} expenseId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getExpense(expenseId) {
    return get(this.request, `/expenses/${expenseId}`, this.token);
  }

  /**
   * Settle (mark as paid) a specific expense split.
   * @param {string} expenseId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async settle(expenseId) {
    return post(this.request, `/expenses/${expenseId}/settle`, {}, this.token);
  }

  /**
   * Delete an expense.
   * @param {string} expenseId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async delete(expenseId) {
    return del(this.request, `/expenses/${expenseId}`, this.token);
  }

  /**
   * Get balance summary for the house.
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getBalances() {
    return get(this.request, `/houses/${this.houseId}/balances`, this.token);
  }
}
