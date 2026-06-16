import React, { useState } from 'react'
import { X } from 'lucide-react'
import api from '../lib/api'
import { useQuery } from '@tanstack/react-query'

const FREQUENCIES = ['once', 'daily', 'weekly', 'monthly']

export default function AddChoreModal({ onClose, onSuccess, chore }) {
  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/houses/members').then(r => r.data),
  })
  const members = membersData?.members || []

  const [form, setForm] = useState({
    title: chore?.title || '',
    description: chore?.description || '',
    frequency: chore?.frequency || 'weekly',
    assigned_to: chore?.assigned_to || '',
    due_date: chore?.due_date ? chore.due_date.split('T')[0] : '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = { ...form }
      if (!body.assigned_to) delete body.assigned_to
      if (!body.due_date) delete body.due_date
      if (chore) {
        await api.put(`/chores/${chore.id}`, body)
      } else {
        await api.post('/chores', body)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save chore')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div data-testid="chore-form" className="bg-surface rounded-t-2xl md:rounded-card w-full md:max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{chore ? 'Edit Chore' : 'Add Chore'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        {error && (
          <div className="bg-red-50 border border-danger text-danger rounded-card p-3 text-sm mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input data-testid="chore-title-input" type="text" value={form.title} onChange={set('title')} required
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Clean kitchen..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Frequency</label>
            <select value={form.frequency} onChange={set('frequency')}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
              {FREQUENCIES.map(f => (
                <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assign to</label>
            <select value={form.assigned_to} onChange={set('assigned_to')}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white">
              <option value="">Anyone</option>
              {members.map(m => (
                <option key={m.user_id || m.id} value={m.user_id || m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input type="date" value={form.due_date} onChange={set('due_date')}
              className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-border rounded-btn text-sm font-semibold hover:bg-gray-50">
              Cancel
            </button>
            <button data-testid="save-chore-btn" type="submit" disabled={loading}
              className="flex-1 bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Saving...' : (chore ? 'Update' : 'Add Chore')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
