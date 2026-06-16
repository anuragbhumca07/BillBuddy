import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Megaphone, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function AnnouncementsPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', message: '' })
  const [loading, setLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data),
  })

  const announcements = data?.announcements || []

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/announcements', form)
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowAdd(false)
      setForm({ title: '', message: '' })
    } catch {}
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    await api.delete(`/announcements/${id}`)
    qc.invalidateQueries({ queryKey: ['announcements'] })
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-textPrimary">Announcements</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-semibold text-sm hover:bg-indigo-700">
          <Plus size={16} /> Post
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-card p-4 mb-4 space-y-3">
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            placeholder="Title"
            className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            required
            placeholder="Message..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2 border border-border rounded-btn text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary text-white py-2 rounded-btn text-sm font-semibold disabled:opacity-50">
              {loading ? '...' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-card animate-pulse" />)}
        </div>
      )}

      {!isLoading && announcements.length === 0 && (
        <div className="text-center py-12 text-textSecondary">
          <Megaphone size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No announcements</p>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="bg-surface border border-border border-l-4 border-l-secondary rounded-card p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-sm text-textPrimary">{a.title}</p>
              <button onClick={() => handleDelete(a.id)}
                className="p-1 hover:bg-red-50 rounded text-danger flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-textSecondary mt-1">{a.message}</p>
            <p className="text-xs text-textSecondary mt-2">
              {a.created_at ? format(new Date(a.created_at), 'd MMM yyyy') : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
