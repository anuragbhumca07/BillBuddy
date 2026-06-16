import React, { useState } from 'react'
import { X } from 'lucide-react'
import api from '../lib/api'

const CATEGORIES = ['Rent', 'Groceries', 'Utilities', 'Internet', 'Cleaning', 'Other']

export default function AddExpenseModal({ onClose, onSuccess, expense }) {
  const [form, setForm] = useState({
    title: expense?.title || '',
    amount: expense?.amount || '',
    category: expense?.category || 'Other',
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (expense) {
        await api.put(`/expenses/${expense.id}`, form)
      } else {
        await api.post('/expenses', form)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div data-testid="expense-form" className="bg-surface rounded-t-2xl md:rounded-card w-full md:max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        {error && (
          <div data-testid="error-message" className="bg-red-50 border border-danger text-danger rounded-card p-3 text-sm mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input data-testid="expense-title-input" type="text" value={form.title} onChange={set('title')} required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Dinner, Groceries..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (&#8377;)</label>
            <input data-testid="expense-amount-input" type="number" value={form.amount} onChange={set('amount')} required min="0.01" step="0.01"
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select data-testid="expense-category-input" value={form.category} onChange={set('category')}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input data-testid="expense-date-input" type="date" value={form.date} onChange={set('date')}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-btn text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button data-testid="save-expense-btn" type="submit" disabled={loading}
              className="flex-1 bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : (expense ? 'Update' : 'Add Expense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
