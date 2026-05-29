import { post } from '../helpers/apiHelper.js';

/**
 * Page Object for authentication-related API calls.
 */
export class LoginPage {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    this.request = request;
  }

  /**
   * Register a new user.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async register(name, email, password) {
    return post(this.request, '/auth/register', { name, email, password });
  }

  /**
   * Login with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async login(email, password) {
    return post(this.request, '/auth/login', { email, password });
  }

  /**
   * Refresh the access token using a refresh token.
   * @param {string} refreshToken
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async refresh(refreshToken) {
    return post(this.request, '/auth/refresh', { refreshToken });
  }

  /**
   * Logout the currently authenticated user (invalidates refresh token).
   * @param {string} token - access token
   * @param {string} refreshToken
   * @returns {Promise<import('@playwright/test').APIResponse>}
   */
  async logout(token, refreshToken) {
    return post(this.request, '/auth/logout', { refreshToken }, token);
  }
}
