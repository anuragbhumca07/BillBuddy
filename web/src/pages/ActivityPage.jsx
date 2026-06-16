import React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ActivityPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  })

  const notifications = data?.notifications || []
  const unread = notifications.filter(n => !n.is_read)

  const markOne = async (id) => {
    await api.put(`/notifications/${id}/read`)
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markAll = async () => {
    await api.put('/notifications/read-all')
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <div data-testid="activity-page" className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-textPrimary">Activity</h2>
        {unread.length > 0 && (
          <button onClick={markAll}
            className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-card animate-pulse" />)}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notifications yet</p>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id}
            className={`flex items-start gap-3 p-4 rounded-card border transition-colors ${
              n.is_read ? 'bg-surface border-border' : 'bg-indigo-50 border-indigo-200'
            }`}>
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-border' : 'bg-primary'}`} />
            <div className="flex-1">
              <p className={`text-sm ${n.is_read ? 'text-textSecondary' : 'text-textPrimary font-medium'}`}>
                {n.message}
              </p>
              <p className="text-xs text-textSecondary mt-1">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </div>
            {!n.is_read && (
              <button onClick={() => markOne(n.id)}
                className="p-1 hover:bg-indigo-100 rounded text-primary">
                <Check size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
