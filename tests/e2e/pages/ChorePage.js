import { post, get, put, del } from '../helpers/apiHelper.js';

/**
 * Page Object for chore management API calls.
 */
export class ChorePage {
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
   * Create a new chore in the house.
   * @param {Object} choreData
   * @param {string} choreData.title
   * @param {string} [choreData.description]
   * @param {string} choreData.frequency - 'daily' | 'weekly' | 'monthly'
   * @param {string} [choreData.assigned_to] - UUID of user
   * @param {string} [choreData.due_date] - ISO date string
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async create(choreData) {
    return post(
      this.request,
      `/houses/${this.houseId}/chores`,
      choreData,
      this.token
    );
  }

  /**
   * List chores for the house, with optional filters.
   * @param {Object} [filters] - e.g. { upcoming: 3 }
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async list(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const path = `/houses/${this.houseId}/chores${params ? `?${params}` : ''}`;
    return get(this.request, path, this.token);
  }

  /**
   * Get chore history (completed chores) for the house.
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getHistory() {
    return get(this.request, `/houses/${this.houseId}/chores/history`, this.token);
  }

  /**
   * Mark a chore as complete.
   * @param {string} choreId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async complete(choreId) {
    return post(this.request, `/chores/${choreId}/complete`, {}, this.token);
  }

  /**
   * Update a chore's details.
   * @param {string} choreId
   * @param {Object} updates
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async update(choreId, updates) {
    return put(this.request, `/chores/${choreId}`, updates, this.token);
  }

  /**
   * Delete a chore.
   * @param {string} choreId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async delete(choreId) {
    return del(this.request, `/chores/${choreId}`, this.token);
  }
}
