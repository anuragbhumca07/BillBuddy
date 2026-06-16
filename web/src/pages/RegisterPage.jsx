import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password })
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">BillBuddy</h1>
          <p className="text-textSecondary mt-2">Create your account</p>
        </div>
        <div className="bg-surface rounded-card shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div data-testid="error-message" className="bg-red-50 border border-danger text-danger rounded-card p-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input data-testid="name-input" type="text" value={form.name} onChange={setField('name')} required
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input data-testid="email-input" type="email" value={form.email} onChange={setField('email')} required
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input data-testid="password-input" type="password" value={form.password} onChange={setField('password')} required
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input data-testid="confirm-password-input" type="password" value={form.confirmPassword} onChange={setField('confirmPassword')} required
                className="w-full px-3 py-2.5 border border-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••" />
            </div>
            <button data-testid="register-btn" type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-btn font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-textSecondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
