const BASE_URL = 'http://localhost:3000';

/**
 * Build headers object, optionally including a Bearer token.
 */
function buildHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * POST request helper.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} path  - e.g. '/auth/register'
 * @param {Object} body  - JSON body
 * @param {string} [token] - optional Bearer token
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
export async function post(request, path, body, token) {
  return request.post(`${BASE_URL}${path}`, {
    headers: buildHeaders(token),
    data: body,
  });
}

/**
 * GET request helper.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} path
 * @param {string} [token]
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
export async function get(request, path, token) {
  return request.get(`${BASE_URL}${path}`, {
    headers: buildHeaders(token),
  });
}

/**
 * PUT request helper.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} path
 * @param {Object} body
 * @param {string} [token]
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
export async function put(request, path, body, token) {
  return request.put(`${BASE_URL}${path}`, {
    headers: buildHeaders(token),
    data: body,
  });
}

/**
 * DELETE request helper.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} path
 * @param {string} [token]
 * @returns {Promise<import('@playwright/test').APIResponse>}
 */
export async function del(request, path, token) {
  return request.delete(`${BASE_URL}${path}`, {
    headers: buildHeaders(token),
  });
}

/**
 * Parse JSON body from an APIResponse, returning an empty object on failure.
 */
export async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
