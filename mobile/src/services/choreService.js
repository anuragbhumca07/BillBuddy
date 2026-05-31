import api from './api';

export const choreService = {
  async getChores(params = {}) {
    const response = await api.get('/chores', { params });
    return response.data.chores || response.data;
  },

  async getChore(choreId) {
    const response = await api.get(`/chores/${choreId}`);
    return response.data.chore || response.data;
  },

  async createChore(data) {
    const response = await api.post('/chores', data);
    return response.data.chore || response.data;
  },

  async updateChore(choreId, data) {
    const response = await api.put(`/chores/${choreId}`, data);
    return response.data.chore || response.data;
  },

  async deleteChore(choreId) {
    const response = await api.delete(`/chores/${choreId}`);
    return response.data;
  },

  async completeChore(choreId) {
    const response = await api.post(`/chores/${choreId}/complete`);
    return response.data.chore || response.data;
  },

  async getHistory(choreId) {
    const url = choreId ? `/chores/${choreId}/history` : '/chores/history';
    const response = await api.get(url);
    return response.data.history || response.data;
  },

  async getMyChores() {
    const response = await api.get('/chores', { params: { mine: true } });
    return response.data.chores || response.data;
  },
};
