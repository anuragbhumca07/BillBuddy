import api from './api';

export const announcementService = {
  async getAnnouncements() {
    const response = await api.get('/announcements');
    return response.data;
  },

  async createAnnouncement(data) {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  async deleteAnnouncement(announcementId) {
    const response = await api.delete(`/announcements/${announcementId}`);
    return response.data;
  },
};
