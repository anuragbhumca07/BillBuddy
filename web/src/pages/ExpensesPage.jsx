import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Plus, Receipt } from 'lucide-react'
import AddExpenseModal from '../components/AddExpenseModal'
import { format } from 'date-fns'

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function ExpensesPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get('/expenses').then(r => r.data),
  })

  const expenses = data?.expenses || []

  return (
    <div data-testid="expenses-page" className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-textPrimary">Expenses</h2>
        <button data-testid="add-expense-btn" onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-semibold text-sm hover:bg-indigo-700">
          <Plus size={16} /> Add
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-card animate-pulse" />)}
        </div>
      )}

      {!isLoading && expenses.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <Receipt size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No expenses yet</p>
          <p className="text-sm">Add your first expense to get started</p>
        </div>
      )}

      <div data-testid="expense-list" className="space-y-2">
        {expenses.map(exp => (
          <Link key={exp.id} to={`/expenses/${exp.id}`} data-testid="expense-item"
            className="bg-surface border border-border rounded-card p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Receipt size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-textPrimary truncate">{exp.title}</p>
              <p className="text-xs text-textSecondary">
                {exp.paid_by === user?.id ? 'You paid' : `${exp.paid_by_name || 'Someone'} paid`}
                {exp.category && ` · ${exp.category}`}
                {exp.date && ` · ${format(new Date(exp.date), 'd MMM yyyy')}`}
              </p>
            </div>
            <span className="text-base font-bold text-textPrimary flex-shrink-0">{fmt(exp.amount)}</span>
          </Link>
        ))}
      </div>

      {showAdd && (
        <AddExpenseModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['expenses'] }); setShowAdd(false) }}
        />
      )}
    </div>
  )
}
