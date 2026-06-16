import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { BookOpen, Plus, Trash2 } from 'lucide-react'

export default function RulesPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [ruleText, setRuleText] = useState('')
  const [loading, setLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => api.get('/rules').then(r => r.data),
  })

  const rules = data?.rules || []

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/rules', { rule_text: ruleText })
      qc.invalidateQueries({ queryKey: ['rules'] })
      setShowAdd(false)
      setRuleText('')
    } catch {}
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    await api.delete(`/rules/${id}`)
    qc.invalidateQueries({ queryKey: ['rules'] })
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-textPrimary">House Rules</h2>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-semibold text-sm hover:bg-indigo-700">
          <Plus size={16} /> Add Rule
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-surface border border-border rounded-card p-4 mb-4 space-y-3">
          <textarea
            value={ruleText}
            onChange={e => setRuleText(e.target.value)}
            required
            placeholder="Enter house rule..."
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 py-2 border border-border rounded-btn text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary text-white py-2 rounded-btn text-sm font-semibold disabled:opacity-50">
              {loading ? '...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-card animate-pulse" />)}
        </div>
      )}

      {!isLoading && rules.length === 0 && (
        <div className="text-center py-12 text-textSecondary">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No rules yet</p>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((r, i) => (
          <div key={r.id} className="flex items-start gap-3 bg-surface border border-border rounded-card p-4">
            <span className="text-primary font-bold text-sm mt-0.5">{i + 1}.</span>
            <p className="flex-1 text-sm text-textPrimary">{r.rule_text}</p>
            <button onClick={() => handleDelete(r.id)}
              className="p-1 hover:bg-red-50 rounded text-danger flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
