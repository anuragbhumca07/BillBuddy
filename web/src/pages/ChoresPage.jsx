import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Plus, CheckSquare, Check, Pencil, Trash2 } from 'lucide-react'
import AddChoreModal from '../components/AddChoreModal'
import { format } from 'date-fns'

export default function ChoresPage() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editChore, setEditChore] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['chores'],
    queryFn: () => api.get('/chores').then(r => r.data),
  })

  const chores = data?.chores || []
  const pending = chores.filter(c => !c.is_completed && !c.completed)
  const completed = chores.filter(c => c.is_completed || c.completed)

  const handleComplete = async (id) => {
    await api.post(`/chores/${id}/complete`)
    qc.invalidateQueries({ queryKey: ['chores'] })
  }

  const handleDelete = async (id) => {
    await api.delete(`/chores/${id}`)
    qc.invalidateQueries({ queryKey: ['chores'] })
  }

  return (
    <div data-testid="chores-page" className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-textPrimary">Chores</h2>
        <button data-testid="add-chore-btn" onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-semibold text-sm hover:bg-indigo-700">
          <Plus size={16} /> Add
        </button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-card animate-pulse" />)}
        </div>
      )}

      {!isLoading && chores.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <CheckSquare size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No chores yet</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-textSecondary text-sm uppercase tracking-wide mb-2">
            Pending ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map(c => (
              <div key={c.id} data-testid="chore-item" className="bg-surface border border-border rounded-card p-4 flex items-center gap-3">
                <button
                  onClick={() => handleComplete(c.id)}
                  className="w-6 h-6 border-2 border-border rounded-md flex-shrink-0 hover:border-success hover:bg-emerald-50 transition-colors"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{c.title}</p>
                  {(c.due_date || c.dueDate) && (
                    <p className="text-xs text-textSecondary">
                      {format(new Date(c.due_date || c.dueDate), 'd MMM')}
                    </p>
                  )}
                  {c.description && (
                    <p className="text-xs text-textSecondary mt-0.5">{c.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setEditChore(c)}
                  className="p-1.5 hover:bg-gray-100 rounded text-textSecondary">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 hover:bg-red-50 rounded text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h3 className="font-semibold text-textSecondary text-sm uppercase tracking-wide mb-2">
            Completed ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map(c => (
              <div key={c.id} className="bg-surface border border-border rounded-card p-4 flex items-center gap-3 opacity-60">
                <div className="w-6 h-6 bg-success rounded-md flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-white" />
                </div>
                <p className="text-sm line-through text-textSecondary flex-1">{c.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <AddChoreModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['chores'] }); setShowAdd(false) }}
        />
      )}
      {editChore && (
        <AddChoreModal
          chore={editChore}
          onClose={() => setEditChore(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['chores'] }); setEditChore(null) }}
        />
      )}
    </div>
  )
}
