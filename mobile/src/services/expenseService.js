import api from './api';

export const expenseService = {
  async getExpenses(params = {}) {
    const response = await api.get('/expenses', { params });
    return response.data.expenses || response.data;
  },

  async getExpense(expenseId) {
    const response = await api.get(`/expenses/${expenseId}`);
    return response.data.expense || response.data;
  },

  async createExpense(data) {
    if (data.receipt) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'receipt') {
          formData.append('receipt', { uri: value, type: 'image/jpeg', name: 'receipt.jpg' });
        } else if (key === 'splits') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      const response = await api.post('/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.expense || response.data;
    }
    const response = await api.post('/expenses', data);
    return response.data.expense || response.data;
  },

  async updateExpense(expenseId, data) {
    const response = await api.put(`/expenses/${expenseId}`, data);
    return response.data.expense || response.data;
  },

  async deleteExpense(expenseId) {
    const response = await api.delete(`/expenses/${expenseId}`);
    return response.data;
  },

  async getBalances(houseId) {
    const path = houseId ? `/houses/${houseId}/balances` : '/expenses/balances';
    const response = await api.get(path);
    return response.data.balances || response.data.debts || response.data;
  },

  async settleDebt(expenseId) {
    const response = await api.post(`/expenses/${expenseId}/settle`);
    return response.data;
  },

  async getExpenseHistory(expenseId) {
    const response = await api.get(`/expenses/${expenseId}/history`);
    return response.data.history || response.data;
  },

  async getMyExpenses() {
    const response = await api.get('/expenses', { params: { mine: true } });
    return response.data.expenses || response.data;
  },
};
