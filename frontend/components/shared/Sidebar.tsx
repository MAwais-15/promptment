'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LogOut, Moon, Sun, Bell, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

interface SidebarProps {
  navItems: NavItem[]
  role: 'student' | 'executor' | 'admin'
}

export function Sidebar({ navItems, role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/')
  }

  const roleColors: Record<string, string> = {
    admin:    'from-amber-500 to-orange-500',
    student:  'from-brand-500 to-blue-500',
    executor: 'from-violet-500 to-purple-600',
  }

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 border-r z-40 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
      style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b ${collapsed ? 'justify-center' : 'gap-3'}`}
           style={{ borderColor: 'var(--border-color)' }}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm shrink-0 bg-gradient-to-br ${roleColors[role]}`}>
          P
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Prompt<span className="text-brand-500">ment</span>
          </span>
        )}
      </div>

      {/* User Card */}
      {!collapsed && user && (
        <div className="mx-3 mt-4 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${roleColors[role]} shrink-0`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </div>
              <div className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                {user.role}
              </div>
            </div>
          </div>
        </div>
      )}
      {collapsed && user && (
        <div className="flex justify-center mt-4 px-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-gradient-to-br ${roleColors[role]}`}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
                  className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? label : undefined}>
              <div className="relative shrink-0">
                <Icon size={18} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 pb-4 space-y-1 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
        <button onClick={toggleTheme}
                className={`nav-item w-full ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? 'Toggle theme' : undefined}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>Toggle Theme</span>}
        </button>
        <button onClick={handleLogout}
                className={`nav-item w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? 'Logout' : undefined}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-20 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm transition-all duration-200 hover:scale-110"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}>
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}

// ─── Mobile Drawer ───────────────────────────────────────
interface MobileDrawerProps {
  navItems: NavItem[]
  role: 'student' | 'executor' | 'admin'
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ navItems, role, open, onClose }: MobileDrawerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    onClose()
    router.push('/')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col"
           style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <span className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            Prompt<span className="text-brand-500">ment</span>
          </span>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={onClose}
                    className={`nav-item ${active ? 'active' : ''}`}>
                <div className="relative">
                  <Icon size={18} />
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="px-3 pb-6 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={handleLogout} className="nav-item w-full text-rose-500">
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
