import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { Scale, ArrowRight } from 'lucide-react'

const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

export default function BalancesPage() {
  const { user } = useAuthStore()
  const { data, isLoading } = useQuery({
    queryKey: ['balances'],
    queryFn: () => api.get('/expenses/balances').then(r => r.data).catch(() => null),
  })

  const balances = data?.balances || data?.debts || []

  let youOwe = 0, youAreOwed = 0
  balances.forEach(d => {
    const from = d.from?.id || d.from
    const to = d.to?.id || d.to
    if (from === user?.id) youOwe += parseFloat(d.amount || 0)
    if (to === user?.id) youAreOwed += parseFloat(d.amount || 0)
  })

  return (
    <div data-testid="balances-page" className="p-4 md:p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-textPrimary mb-6">Balances</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-card p-4">
          <p className="text-xs text-textSecondary font-medium">You are owed</p>
          <p className="text-2xl font-extrabold text-success">{fmt(youAreOwed)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-card p-4">
          <p className="text-xs text-textSecondary font-medium">You owe</p>
          <p className="text-2xl font-extrabold text-danger">{fmt(youOwe)}</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-card animate-pulse" />)}
        </div>
      )}

      {!isLoading && balances.length === 0 && (
        <div className="text-center py-12 text-textSecondary">
          <Scale size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">All settled up!</p>
        </div>
      )}

      <div className="space-y-2">
        {balances.map((d, i) => {
          const from = d.from?.id || d.from
          const to = d.to?.id || d.to
          const isYouOwe = from === user?.id
          const isYouAreOwed = to === user?.id
          return (
            <div key={d.id || i}
              className={`flex items-center gap-3 p-4 rounded-card border ${
                isYouOwe
                  ? 'bg-red-50 border-red-200'
                  : isYouAreOwed
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-surface border-border'
              }`}>
              <span className="text-sm font-medium">{isYouOwe ? 'You' : (d.from_name || 'Someone')}</span>
              <ArrowRight size={16} className="text-textSecondary" />
              <span className="text-sm font-medium">{isYouAreOwed ? 'You' : (d.to_name || 'Someone')}</span>
              <span className="ml-auto text-base font-bold">{fmt(d.amount)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
