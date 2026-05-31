import api from './api';

export const houseService = {
  async getHouse() {
    const response = await api.get('/houses/mine');
    return response.data.house || response.data;
  },

  async createHouse(data) {
    const response = await api.post('/houses', data);
    return response.data.house || response.data;
  },

  async joinHouse(code) {
    const response = await api.post('/houses/join', { invite_code: code, code });
    return response.data.house || response.data;
  },

  async getMembers() {
    const response = await api.get('/houses/members');
    return response.data.members || response.data;
  },

  async removeMember(memberId) {
    const response = await api.delete(`/houses/members/${memberId}`);
    return response.data;
  },

  async getRules() {
    const response = await api.get('/houses/rules');
    return response.data.rules || response.data;
  },

  async addRule(data) {
    const response = await api.post('/houses/rules', data);
    return response.data.rule || response.data;
  },

  async updateRule(ruleId, data) {
    const response = await api.put(`/rules/${ruleId}`, data);
    return response.data.rule || response.data;
  },

  async deleteRule(ruleId) {
    const response = await api.delete(`/rules/${ruleId}`);
    return response.data;
  },

  async updateHouse(data) {
    const response = await api.put('/houses', data);
    return response.data.house || response.data;
  },

  async leaveHouse() {
    const response = await api.post('/houses/leave');
    return response.data;
  },
};
