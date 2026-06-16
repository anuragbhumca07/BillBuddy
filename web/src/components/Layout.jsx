import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Receipt, CheckSquare, Clock, User, LogOut, Bell, Users, Megaphone, BookOpen, Scale } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home', testid: 'nav-home' },
  { to: '/expenses', icon: Receipt, label: 'Expenses', testid: 'nav-expenses' },
  { to: '/chores', icon: CheckSquare, label: 'Chores', testid: 'nav-chores' },
  { to: '/activity', icon: Clock, label: 'Activity', testid: 'nav-activity' },
  { to: '/profile', icon: User, label: 'Profile', testid: 'nav-profile' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000,
  })
  const unreadCount = notifData?.notifications?.filter(n => !n.is_read).length || 0

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside data-testid="sidebar" className="hidden md:flex flex-col w-64 bg-surface border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">BillBuddy</h1>
          {user && <p className="text-sm text-textSecondary mt-1">Hello, {user.name?.split(' ')[0]}</p>}
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, testid }) => (
            <NavLink key={to} to={to} data-testid={testid} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-colors ${
                isActive ? 'bg-primary text-white' : 'text-textSecondary hover:bg-background hover:text-textPrimary'
              }`
            }>
              {({ isActive }) => (
                <>
                  <Icon size={18} />
                  <span>{label}</span>
                  {label === 'Activity' && unreadCount > 0 && (
                    <span className="ml-auto bg-danger text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
          <div className="border-t border-border my-2" />
          <NavLink to="/house" data-testid="nav-house" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-white' : 'text-textSecondary hover:bg-background hover:text-textPrimary'
            }`
          }>
            <Users size={18} /><span>Members</span>
          </NavLink>
          <NavLink to="/balances" data-testid="nav-balances" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-white' : 'text-textSecondary hover:bg-background hover:text-textPrimary'
            }`
          }>
            <Scale size={18} /><span>Balances</span>
          </NavLink>
          <NavLink to="/announcements" data-testid="nav-announcements" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-white' : 'text-textSecondary hover:bg-background hover:text-textPrimary'
            }`
          }>
            <Megaphone size={18} /><span>Announcements</span>
          </NavLink>
          <NavLink to="/rules" data-testid="nav-rules" className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-white' : 'text-textSecondary hover:bg-background hover:text-textPrimary'
            }`
          }>
            <BookOpen size={18} /><span>House Rules</span>
          </NavLink>
        </nav>
        <div className="p-4 border-t border-border">
          <button data-testid="logout-btn" onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-red-50 rounded-card transition-colors">
            <LogOut size={16} /><span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Bottom nav - mobile */}
        <nav data-testid="bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex">
          {navItems.map(({ to, icon: Icon, label, testid }) => (
            <NavLink key={to} to={to} data-testid={`mobile-${testid}`} className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-textSecondary'
              }`
            }>
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={20} />
                    {label === 'Activity' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                    )}
                  </div>
                  <span className="mt-0.5">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
