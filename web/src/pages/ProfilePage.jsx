import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2 } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.put('/users/profile', { name })
      setUser({ ...user, name: data.name || name })
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div data-testid="profile-page" className="p-4 md:p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-textPrimary mb-6">Profile</h2>

      <div className="bg-surface border border-border rounded-card p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <div>
            <p data-testid="user-name" className="text-lg font-bold text-textPrimary">{user?.name}</p>
            <p data-testid="user-email" className="text-sm text-textSecondary">{user?.email}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            {error && <div className="text-danger text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                data-testid="name-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditing(false); setName(user?.name || '') }}
                className="flex-1 py-2 border border-border rounded-btn text-sm font-semibold">
                Cancel
              </button>
              <button
                data-testid="save-profile-btn"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-primary text-white py-2 rounded-btn text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <button
            data-testid="edit-profile-btn"
            onClick={() => { setEditing(true); setName(user?.name || '') }}
            className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
            <Edit2 size={14} /> Edit Profile
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-card p-4">
        <button
          data-testid="logout-btn"
          onClick={handleLogout}
          className="flex items-center gap-2 text-danger text-sm font-semibold hover:opacity-80 w-full">
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  )
}
