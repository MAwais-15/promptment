'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar, MobileDrawer } from '@/components/shared/Sidebar'
import {
  LayoutDashboard, Search, CheckSquare, MessageSquare,
  Wallet, Star, User, Bell, Menu
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const executorNav = [
  { href: '/executor/dashboard',    label: 'Dashboard',          icon: LayoutDashboard },
  { href: '/executor/browse',       label: 'Browse Assignments',  icon: Search },
  { href: '/executor/assignments',  label: 'My Work',            icon: CheckSquare },
  { href: '/executor/chat',         label: 'Messages',           icon: MessageSquare, badge: 2 },
  { href: '/executor/wallet',       label: 'Wallet',             icon: Wallet },
  { href: '/executor/reviews',      label: 'Reviews',            icon: Star },
  { href: '/executor/profile',      label: 'Profile',            icon: User },
]

export default function ExecutorLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== 'executor') {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!user || user.role !== 'executor') return null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar navItems={executorNav} role="executor" />
      <MobileDrawer navItems={executorNav} role="executor" open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b shrink-0"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Executor Panel</p>
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {user?.name || 'Executor'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display font-semibold"
                 style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Available
            </div>
            <button className="relative p-2 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>
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