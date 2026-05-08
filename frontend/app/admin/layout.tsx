'use client'

import { useState } from 'react'
import { Sidebar, MobileDrawer } from '@/components/shared/Sidebar'
import {
  LayoutDashboard, Users, BookOpen, DollarSign,
  ShieldCheck, Activity, Settings, Bell, Menu, AlertTriangle
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const adminNav = [
  { href: '/admin/dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/users',       label: 'Users',          icon: Users },
  { href: '/admin/assignments', label: 'Assignments',    icon: BookOpen },
  { href: '/admin/approvals',   label: 'Approvals',      icon: ShieldCheck, badge: 4 },
  { href: '/admin/payments',    label: 'Payments',       icon: DollarSign },
  { href: '/admin/fraud',       label: 'Fraud Alerts',   icon: AlertTriangle, badge: 2 },
  { href: '/admin/logs',        label: 'Activity Logs',  icon: Activity },
  { href: '/admin/settings',    label: 'Settings',       icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar navItems={adminNav} role="admin" />
      <MobileDrawer navItems={adminNav} role="admin" open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b shrink-0"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs font-display font-semibold px-2 py-0.5 rounded-full inline-block"
                 style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                Admin Panel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-display font-semibold"
                 style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
              {user?.name || 'Admin'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
