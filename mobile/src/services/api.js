import axios from 'axios';
import { storage } from '../utils/storage';
import { handleMockRequest, isNetworkError } from './mockApiHandler';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
const IS_DEMO_MODE = !process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── In demo mode: bypass the network entirely, always use mock data ──────────
if (IS_DEMO_MODE) {
  api.defaults.adapter = (config) =>
    new Promise((resolve, reject) => {
      try {
        const mockRes = handleMockRequest(config);
        resolve({
          data: mockRes.data,
          status: mockRes.status || 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config,
          request: {},
        });
      } catch (err) {
        reject(err);
      }
    });
}

// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Track refresh state ──────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

// WeakSets avoid mutating error.config, which is non-extensible in Hermes
const _mockRetried = new WeakSet();
const _tokenRetried = new WeakSet();

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Fallback to mock data on network errors ────────────────────────────
    if (isNetworkError(error) && originalRequest && !_mockRetried.has(originalRequest)) {
      _mockRetried.add(originalRequest);
      try {
        const mockResponse = handleMockRequest(originalRequest);
        return Promise.resolve(mockResponse);
      } catch (mockError) {
        return Promise.reject(mockError);
      }
    }

    // ── 401: try token refresh ─────────────────────────────────────────────
    if (error.response?.status === 401 && originalRequest && !_tokenRetried.has(originalRequest) && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      _tokenRetried.add(originalRequest);
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await storage.saveTokens(accessToken, newRefreshToken || refreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        await storage.clearAll();
        if (global.onAuthFailure) global.onAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
