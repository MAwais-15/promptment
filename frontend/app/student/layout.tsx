'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar, MobileDrawer } from '@/components/shared/Sidebar'
import {
  LayoutDashboard, PlusCircle, BookOpen, MessageSquare,
  CreditCard, Star, User, Bell, Menu
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

const studentNav = [
  { href: '/student/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/student/post',         label: 'Post Assignment', icon: PlusCircle },
  { href: '/student/assignments',  label: 'My Assignments',  icon: BookOpen },
  { href: '/student/chat',         label: 'Messages',        icon: MessageSquare, badge: 3 },
  { href: '/student/payments',     label: 'Payments',        icon: CreditCard },
  { href: '/student/reviews',      label: 'Reviews',         icon: Star },
  { href: '/student/profile',      label: 'Profile',         icon: User },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== 'student') {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!user || user.role !== 'student') return null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar navItems={studentNav} role="student" />
      <MobileDrawer navItems={studentNav} role="student" open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b shrink-0"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Welcome back,</p>
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {user?.name || 'Student'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl transition-colors" style={{ background: 'var(--bg-tertiary)' }}>
              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            </button>
            <Link href="/student/post" className="btn-primary py-2 px-4 text-sm">
              <PlusCircle size={15} />
              <span className="hidden sm:inline">Post Assignment</span>
            </Link>
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