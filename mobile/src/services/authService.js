import api from './api';
import { storage } from '../utils/storage';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = response.data;
    await storage.saveTokens(accessToken, refreshToken);
    await storage.saveUser(user);
    return { user, accessToken, refreshToken };
  },

  async register(name, email, password) {
    const response = await api.post('/auth/register', { name, email, password });
    const { user, accessToken, refreshToken } = response.data;
    await storage.saveTokens(accessToken, refreshToken);
    await storage.saveUser(user);
    return { user, accessToken, refreshToken };
  },

  async logout() {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout API errors, still clear local state
    } finally {
      await storage.clearAll();
    }
  },

  async refreshToken() {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    await storage.saveTokens(accessToken, newRefreshToken || refreshToken);
    return accessToken;
  },

  async updateProfile(data) {
    const response = await api.put('/users/profile', data);
    const user = response.data.user || response.data;
    await storage.saveUser(user);
    return user;
  },

  async updateAvatar(imageUri) {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });
    const response = await api.put('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const user = response.data.user || response.data;
    await storage.saveUser(user);
    return user;
  },

  async savePushToken(pushToken) {
    const response = await api.put('/users/profile', { push_token: pushToken });
    return response.data;
  },
};
