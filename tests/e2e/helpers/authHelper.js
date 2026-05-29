import { post } from './apiHelper.js';

/**
 * Register a new user and return the token + user object.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {{ name: string, email: string, password: string }} userData
 * @returns {Promise<{ token: string, refreshToken: string, user: Object }>}
 */
export async function registerUser(request, userData) {
  const response = await post(request, '/auth/register', {
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  if (!response.ok()) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `registerUser failed [${response.status()}]: ${JSON.stringify(body)}`
    );
  }

  const body = await response.json();
  return {
    token: body.accessToken || body.token,
    refreshToken: body.refreshToken,
    user: body.user,
  };
}

/**
 * Login an existing user and return the token + user object.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, refreshToken: string, user: Object }>}
 */
export async function loginUser(request, email, password) {
  const response = await post(request, '/auth/login', { email, password });

  if (!response.ok()) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `loginUser failed [${response.status()}]: ${JSON.stringify(body)}`
    );
  }

  const body = await response.json();
  return {
    token: body.accessToken || body.token,
    refreshToken: body.refreshToken,
    user: body.user,
  };
}
