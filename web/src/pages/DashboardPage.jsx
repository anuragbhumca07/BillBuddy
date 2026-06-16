import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { Plus, Receipt, CheckSquare, Users, BookOpen, ChevronRight, AlertCircle, Clock } from 'lucide-react'
import AddExpenseModal from '../components/AddExpenseModal'
import AddChoreModal from '../components/AddChoreModal'
import { format } from 'date-fns'

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d) => d ? format(new Date(d), 'd MMM yyyy') : ''
const isOverdue = (d) => d && new Date(d) < new Date()

export default function DashboardPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddChore, setShowAddChore] = useState(false)

  const { data: houseData } = useQuery({
    queryKey: ['house'],
    queryFn: () => api.get('/houses/mine').then(r => r.data).catch(() => null),
  })
  const { data: expData } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get('/expenses').then(r => r.data),
  })
  const { data: balData } = useQuery({
    queryKey: ['balances'],
    queryFn: () => api.get('/expenses/balances').then(r => r.data).catch(() => null),
  })
  const { data: chData } = useQuery({
    queryKey: ['chores'],
    queryFn: () => api.get('/chores').then(r => r.data),
  })
  const { data: annData } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data),
  })

  const house = houseData?.house
  const expenses = expData?.expenses || []
  const balances = balData?.balances || balData?.debts || []
  const chores = chData?.chores || []
  const announcements = annData?.announcements || []

  // Compute net balance from perspective of current user
  let youOwe = 0, youAreOwed = 0
  balances.forEach(d => {
    const from = d.from?.id || d.from
    const to = d.to?.id || d.to
    if (from === user?.id) youOwe += parseFloat(d.amount || 0)
    if (to === user?.id) youAreOwed += parseFloat(d.amount || 0)
  })
  const netBalance = youAreOwed - youOwe

  const upcomingChores = chores
    .filter(c => !c.is_completed && !c.completed)
    .sort((a, b) => new Date(a.due_date || a.dueDate || 0) - new Date(b.due_date || b.dueDate || 0))
    .slice(0, 3)

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))
    .slice(0, 5)

  const latestAnn = announcements[0]

  return (
    <div data-testid="dashboard" className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">Hello, {user?.name?.split(' ')[0] || 'there'} &#128075;</h2>
          {house && <p className="text-sm text-textSecondary">{house.name}</p>}
        </div>
        <button data-testid="add-expense-btn" onClick={() => setShowAddExpense(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-btn font-semibold text-sm hover:bg-indigo-700 transition-colors">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* No house card */}
      {!house && (
        <div className="bg-surface rounded-card shadow-sm p-6 mb-4 text-center border border-border">
          <p className="font-semibold text-textPrimary mb-1">No household yet</p>
          <p className="text-sm text-textSecondary mb-4">Create or join a household to get started</p>
          <div className="flex gap-3 justify-center">
            <Link to="/house" className="bg-primary text-white px-4 py-2 rounded-btn text-sm font-semibold">Create / Join</Link>
          </div>
        </div>
      )}

      {/* Balance card */}
      {house && (
        <Link to="/balances" className={`block rounded-card p-5 mb-4 border shadow-sm ${netBalance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-textSecondary font-medium">{netBalance >= 0 ? 'You are owed' : 'You owe'}</p>
              <p className="text-3xl font-extrabold text-textPrimary">{fmt(Math.abs(netBalance))}</p>
              {youOwe > 0 && youAreOwed > 0 && (
                <p className="text-xs text-textSecondary mt-1">Owe {fmt(youOwe)} &middot; Owed {fmt(youAreOwed)}</p>
              )}
            </div>
            <ChevronRight size={20} className={netBalance >= 0 ? 'text-success' : 'text-danger'} />
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Add Expense', icon: Receipt, color: 'text-primary bg-indigo-50', action: () => setShowAddExpense(true), testid: 'quick-add-expense' },
          { label: 'Add Chore', icon: CheckSquare, color: 'text-success bg-emerald-50', action: () => setShowAddChore(true), testid: 'quick-add-chore' },
          { label: 'Members', icon: Users, color: 'text-secondary bg-purple-50', action: null, to: '/house', testid: 'quick-members' },
          { label: 'Rules', icon: BookOpen, color: 'text-warning bg-amber-50', action: null, to: '/rules', testid: 'quick-rules' },
        ].map(({ label, icon: Icon, color, action, to, testid }) => (
          action ? (
            <button key={label} data-testid={testid} onClick={action} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-card flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
              <span className="text-xs font-medium text-textPrimary text-center">{label}</span>
            </button>
          ) : (
            <Link key={label} to={to} data-testid={testid} className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-card flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
              <span className="text-xs font-medium text-textPrimary text-center">{label}</span>
            </Link>
          )
        ))}
      </div>

      {/* Upcoming chores */}
      {upcomingChores.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-textPrimary">Upcoming Chores</h3>
            <Link to="/chores" className="text-sm text-primary font-semibold">See all</Link>
          </div>
          <div className="space-y-2">
            {upcomingChores.map(c => {
              const overdue = isOverdue(c.due_date || c.dueDate)
              return (
                <div key={c.id} className="bg-surface border border-border rounded-card p-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${overdue ? 'bg-red-50' : 'bg-amber-50'}`}>
                    {overdue
                      ? <AlertCircle size={18} className="text-danger" />
                      : <Clock size={18} className="text-warning" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-textPrimary">{c.title}</p>
                    <p className={`text-xs ${overdue ? 'text-danger font-medium' : 'text-textSecondary'}`}>
                      {overdue ? 'Overdue' : fmtDate(c.due_date || c.dueDate)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent expenses */}
      {recentExpenses.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-textPrimary">Recent Expenses</h3>
            <Link to="/expenses" className="text-sm text-primary font-semibold">See all</Link>
          </div>
          <div className="space-y-2">
            {recentExpenses.map(exp => (
              <Link key={exp.id} to={`/expenses/${exp.id}`}
                className="bg-surface border border-border rounded-card p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Receipt size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-textPrimary">{exp.title}</p>
                  <p className="text-xs text-textSecondary">
                    {exp.paid_by === user?.id ? 'You paid' : `${exp.paid_by_name || 'Someone'} paid`}
                  </p>
                </div>
                <span className="text-sm font-bold text-textPrimary">{fmt(exp.amount)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest announcement */}
      {latestAnn && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-textPrimary">Latest Announcement</h3>
            <Link to="/announcements" className="text-sm text-primary font-semibold">See all</Link>
          </div>
          <Link to="/announcements" className="bg-surface border border-border border-l-4 border-l-secondary rounded-card p-4 block hover:bg-gray-50">
            <p className="text-sm font-bold text-textPrimary">{latestAnn.title}</p>
            <p className="text-sm text-textSecondary mt-1 line-clamp-2">{latestAnn.message}</p>
          </Link>
        </div>
      )}

      {showAddExpense && (
        <AddExpenseModal
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => { qc.invalidateQueries(); setShowAddExpense(false) }}
        />
      )}
      {showAddChore && (
        <AddChoreModal
          onClose={() => setShowAddChore(false)}
          onSuccess={() => { qc.invalidateQueries(); setShowAddChore(false) }}
        />
      )}
    </div>
  )
}
