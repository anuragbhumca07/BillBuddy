import { post, get, del } from '../helpers/apiHelper.js';

/**
 * Page Object for announcements and house rules API calls.
 */
export class AnnouncementPage {
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

  // ─── Announcements ──────────────────────────────────────────────────────────

  /**
   * Post a new announcement.
   * @param {{ title: string, message: string }} announcementData
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async createAnnouncement(announcementData) {
    return post(
      this.request,
      `/houses/${this.houseId}/announcements`,
      announcementData,
      this.token
    );
  }

  /**
   * List all announcements for the house.
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async listAnnouncements() {
    return get(this.request, `/houses/${this.houseId}/announcements`, this.token);
  }

  /**
   * Delete an announcement.
   * @param {string} announcementId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async deleteAnnouncement(announcementId) {
    return del(this.request, `/announcements/${announcementId}`, this.token);
  }

  // ─── House Rules ─────────────────────────────────────────────────────────────

  /**
   * Add a house rule.
   * @param {{ rule_text: string }} ruleData
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async createRule(ruleData) {
    return post(
      this.request,
      `/houses/${this.houseId}/rules`,
      ruleData,
      this.token
    );
  }

  /**
   * List all house rules.
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async listRules() {
    return get(this.request, `/houses/${this.houseId}/rules`, this.token);
  }

  /**
   * Delete a house rule.
   * @param {string} ruleId
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async deleteRule(ruleId) {
    return del(this.request, `/houses/${this.houseId}/rules/${ruleId}`, this.token);
  }
}
