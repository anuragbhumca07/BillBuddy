import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  PUSH_TOKEN: 'push_token',
};

export const storage = {
  // Token methods
  async saveTokens(accessToken, refreshToken) {
    try {
      await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  },

  async getAccessToken() {
    try {
      return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async clearTokens() {
    try {
      await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  },

  // User methods
  async saveUser(user) {
    try {
      await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  },

  async getUser() {
    try {
      const userStr = await SecureStore.getItemAsync(KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  async clearUser() {
    try {
      await SecureStore.deleteItemAsync(KEYS.USER);
    } catch (error) {
      console.error('Error clearing user:', error);
    }
  },

  // Push token methods
  async savePushToken(token) {
    try {
      await SecureStore.setItemAsync(KEYS.PUSH_TOKEN, token);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  },

  async getPushToken() {
    try {
      return await SecureStore.getItemAsync(KEYS.PUSH_TOKEN);
    } catch {
      return null;
    }
  },

  // Clear all stored data (for logout)
  async clearAll() {
    try {
      await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(KEYS.USER);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  // Load initial auth state
  async loadAuthState() {
    try {
      const [accessToken, refreshToken, userStr] = await Promise.all([
        SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(KEYS.USER),
      ]);
      const user = userStr ? JSON.parse(userStr) : null;
      return { accessToken, refreshToken, user };
    } catch {
      return { accessToken: null, refreshToken: null, user: null };
    }
  },
};

export default storage;
