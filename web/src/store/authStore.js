import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  init: async () => {
    const token = localStorage.getItem('billbuddy_token');
    if (!token) { set({ isLoading: false }); return; }
    try {
      const { data } = await api.get('/users/profile');
      set({ user: data.data || data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('billbuddy_token');
      localStorage.removeItem('billbuddy_refresh');
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('billbuddy_token', data.accessToken);
    localStorage.setItem('billbuddy_refresh', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
    return data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('billbuddy_refresh');
    try { if (refreshToken) await api.post('/auth/logout', { refreshToken }); } catch {}
    localStorage.removeItem('billbuddy_token');
    localStorage.removeItem('billbuddy_refresh');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),
}));
