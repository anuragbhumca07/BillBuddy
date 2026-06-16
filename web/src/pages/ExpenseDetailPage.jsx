import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { ArrowLeft, Pencil, Trash2, Check } from 'lucide-react'
import AddExpenseModal from '../components/AddExpenseModal'
import { format } from 'date-fns'

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function ExpenseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showEdit, setShowEdit] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => api.get(`/expenses/${id}`).then(r => r.data),
  })

  const expense = data?.expense
  const splits = data?.splits || []

  const handleDelete = async () => {
    await api.delete(`/expenses/${id}`)
    qc.invalidateQueries({ queryKey: ['expenses'] })
    navigate('/expenses')
  }

  const handleSettle = async () => {
    await api.post(`/expenses/${id}/settle`)
    qc.invalidateQueries({ queryKey: ['expense', id] })
  }

  if (isLoading) return (
    <div className="p-6 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
    </div>
  )
  if (!expense) return <div className="p-6 text-center text-textSecondary">Expense not found</div>

  const mySettled = splits.find(s => s.user_id === user?.id)?.is_settled

  return (
    <div data-testid="expense-detail" className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold flex-1">{expense.title}</h2>
        <button data-testid="edit-expense-btn" onClick={() => setShowEdit(true)}
          className="p-2 hover:bg-gray-100 rounded-full text-textSecondary">
          <Pencil size={18} />
        </button>
        <button data-testid="delete-expense-btn" onClick={() => setShowConfirmDelete(true)}
          className="p-2 hover:bg-red-50 rounded-full text-danger">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="bg-surface border border-border rounded-card p-5 mb-4">
        <p className="text-3xl font-extrabold text-textPrimary mb-3">{fmt(expense.amount)}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-textSecondary">Paid by</p>
            <p className="font-semibold">{expense.paid_by === user?.id ? 'You' : (expense.paid_by_name || 'Someone')}</p>
          </div>
          <div>
            <p className="text-textSecondary">Category</p>
            <p className="font-semibold">{expense.category || 'Other'}</p>
          </div>
          <div>
            <p className="text-textSecondary">Date</p>
            <p className="font-semibold">{expense.date ? format(new Date(expense.date), 'd MMM yyyy') : '—'}</p>
          </div>
          <div>
            <p className="text-textSecondary">Status</p>
            <p className={`font-semibold ${mySettled ? 'text-success' : 'text-warning'}`}>
              {mySettled ? 'Settled' : 'Unsettled'}
            </p>
          </div>
        </div>
      </div>

      <div data-testid="split-breakdown" className="bg-surface border border-border rounded-card p-5 mb-4">
        <h3 className="font-bold mb-3">Split Breakdown</h3>
        <div className="space-y-2">
          {splits.map(s => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{s.user_id === user?.id ? 'You' : (s.user_name || 'Member')}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{fmt(s.amount_owed)}</span>
                {s.is_settled ? (
                  <span className="text-success text-xs font-semibold flex items-center gap-1">
                    <Check size={12} /> Settled
                  </span>
                ) : (
                  <span className="text-warning text-xs font-semibold">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {!mySettled && expense.paid_by !== user?.id && (
          <button onClick={handleSettle} data-testid="settle-btn"
            className="mt-4 w-full bg-success text-white py-2 rounded-btn text-sm font-semibold hover:bg-emerald-600">
            Mark My Share as Settled
          </button>
        )}
      </div>

      {showEdit && (
        <AddExpenseModal
          expense={expense}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['expense', id] })
            qc.invalidateQueries({ queryKey: ['expenses'] })
            setShowEdit(false)
          }}
        />
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-card p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Delete Expense?</h3>
            <p className="text-textSecondary text-sm mb-5">
              This will permanently delete "{expense.title}" and all its splits.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2 border border-border rounded-btn text-sm font-semibold">
                Cancel
              </button>
              <button data-testid="confirm-delete-btn" onClick={handleDelete}
                className="flex-1 py-2 bg-danger text-white rounded-btn text-sm font-semibold hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
