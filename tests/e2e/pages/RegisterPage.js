import { post } from '../helpers/apiHelper.js';

/**
 * Page Object for user registration API calls.
 * Wraps /auth/register endpoint.
 */
export class RegisterPage {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    this.request = request;
  }

  /**
   * Submit a registration form.
   * @param {{ name: string, email: string, password: string }} userData
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async submitRegistration(userData) {
    return post(this.request, '/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });
  }

  /**
   * Register and return parsed tokens + user on success.
   * @param {{ name: string, email: string, password: string }} userData
   * @returns {Promise<{ token: string, refreshToken: string, user: Object }>}
   */
  async registerAndGetTokens(userData) {
    const response = await this.submitRegistration(userData);
    if (!response.ok()) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`Registration failed [${response.status()}]: ${JSON.stringify(body)}`);
    }
    const body = await response.json();
    return {
      token: body.accessToken || body.token,
      refreshToken: body.refreshToken,
      user: body.user,
    };
  }
}
