import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { Home, Copy, Check } from 'lucide-react'

export default function HousePage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', address: '' })
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: houseData } = useQuery({
    queryKey: ['house'],
    queryFn: () => api.get('/houses/mine').then(r => r.data).catch(() => null),
  })
  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/houses/members').then(r => r.data).catch(() => ({ members: [] })),
    enabled: !!houseData?.house,
  })

  const house = houseData?.house
  const members = membersData?.members || []

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/houses', createForm)
      qc.invalidateQueries()
      setShowCreate(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create house')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/houses/join', { inviteCode: joinCode })
      qc.invalidateQueries()
      setShowJoin(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid invite code')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(house.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  if (!house) {
    return (
      <div data-testid="house-page" className="p-4 md:p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-textPrimary mb-6">Household</h2>
        <div className="bg-surface border border-border rounded-card p-8 text-center">
          <Home size={48} className="mx-auto mb-4 text-primary opacity-50" />
          <p className="font-semibold text-textPrimary mb-2">No household yet</p>
          <p className="text-sm text-textSecondary mb-6">Create a new household or join an existing one</p>
          {error && <p className="text-danger text-sm mb-3">{error}</p>}
          {showCreate ? (
            <form onSubmit={handleCreate} className="text-left space-y-3">
              <input
                type="text"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Household name"
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={createForm.address}
                onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Address (optional)"
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 border border-border rounded-btn text-sm font-semibold">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-primary text-white py-2 rounded-btn text-sm font-semibold disabled:opacity-50">
                  {loading ? '...' : 'Create'}
                </button>
              </div>
            </form>
          ) : showJoin ? (
            <form onSubmit={handleJoin} className="text-left space-y-3">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                required
                placeholder="Invite code"
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowJoin(false)}
                  className="flex-1 py-2 border border-border rounded-btn text-sm font-semibold">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-secondary text-white py-2 rounded-btn text-sm font-semibold disabled:opacity-50">
                  {loading ? '...' : 'Join'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowCreate(true)}
                className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-semibold">Create</button>
              <button onClick={() => setShowJoin(true)}
                className="bg-secondary text-white px-5 py-2 rounded-btn text-sm font-semibold">Join</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div data-testid="house-page" className="p-4 md:p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-textPrimary mb-2">{house.name}</h2>
      {house.address && <p className="text-textSecondary text-sm mb-4">{house.address}</p>}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-textSecondary">Invite code:</span>
        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{house.invite_code}</code>
        <button onClick={copyCode} className="p-1 hover:bg-gray-100 rounded text-textSecondary">
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        </button>
      </div>

      <div data-testid="members-list" className="bg-surface border border-border rounded-card divide-y divide-border">
        {members.map(m => (
          <div key={m.id || m.user_id} className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {getInitials(m.name)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{m.name}</p>
              <p className="text-xs text-textSecondary">{m.email}</p>
            </div>
            {m.role === 'admin' && (
              <span className="text-xs bg-indigo-100 text-primary px-2 py-0.5 rounded-full font-semibold">Admin</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
