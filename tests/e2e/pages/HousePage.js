import { post, get, del } from '../helpers/apiHelper.js';

/**
 * Page Object for house management API calls.
 */
export class HousePage {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} token - Bearer access token
   */
  constructor(request, token) {
    this.request = request;
    this.token = token;
  }

  /**
   * Create a new house.
   * @param {{ name: string, address?: string }} houseData
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async create(houseData) {
    return post(this.request, '/houses', houseData, this.token);
  }

  /**
   * Join a house with an invite code.
   * @param {string} inviteCode
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async join(inviteCode) {
    return post(this.request, '/houses/join', { invite_code: inviteCode }, this.token);
  }

  /**
   * Get house details.
   * @param {string} houseId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async getHouse(houseId) {
    return get(this.request, `/houses/${houseId}`, this.token);
  }

  /**
   * List members of a house.
   * @param {string} houseId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async listMembers(houseId) {
    return get(this.request, `/houses/${houseId}/members`, this.token);
  }

  /**
   * Remove a member from a house (admin only).
   * @param {string} houseId
   * @param {string} userId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async removeMember(houseId, userId) {
    return del(this.request, `/houses/${houseId}/members/${userId}`, this.token);
  }

  /**
   * Leave a house.
   * @param {string} houseId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async leaveHouse(houseId) {
    return del(this.request, `/houses/${houseId}/leave`, this.token);
  }
}
