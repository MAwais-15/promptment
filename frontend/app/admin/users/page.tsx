'use client'

import { useState, useEffect } from 'react'
import {
  Search, UserCheck, UserX, Shield, GraduationCap,
  Briefcase, Star, ChevronDown, RefreshCw, Eye, X
} from 'lucide-react'
import { format } from 'date-fns'
import { adminAPI } from '@/lib/api'
import toast from 'react-hot-toast'

const MOCK_USERS = [
  { _id: 'u1', name: 'Ahmed Khan',   email: 'student1@test.com', role: 'student',  city: 'Karachi',    university: 'FAST NUCES', rating: 0,   totalReviews: 0,  walletBalance: 5000,  banned: false, verified: true,  createdAt: new Date(Date.now() - 30*86400000).toISOString() },
  { _id: 'u2', name: 'Sara Malik',   email: 'student2@test.com', role: 'student',  city: 'Lahore',     university: 'LUMS',       rating: 0,   totalReviews: 0,  walletBalance: 3200,  banned: false, verified: true,  createdAt: new Date(Date.now() - 25*86400000).toISOString() },
  { _id: 'u3', name: 'Bilal Raza',   email: 'exec1@test.com',    role: 'executor', city: 'Karachi',    university: 'FAST NUCES', rating: 4.8, totalReviews: 15, walletBalance: 12500, banned: false, verified: true,  createdAt: new Date(Date.now() - 45*86400000).toISOString() },
  { _id: 'u4', name: 'Zara Ahmed',   email: 'exec2@test.com',    role: 'executor', city: 'Lahore',     university: 'LUMS',       rating: 4.6, totalReviews: 10, walletBalance: 8400,  banned: false, verified: true,  createdAt: new Date(Date.now() - 20*86400000).toISOString() },
  { _id: 'u5', name: 'Omar Sheikh',  email: 'exec3@test.com',    role: 'executor', city: 'Islamabad',  university: 'NUST',       rating: 4.9, totalReviews: 22, walletBalance: 6200,  banned: false, verified: true,  createdAt: new Date(Date.now() - 60*86400000).toISOString() },
  { _id: 'u6', name: 'Spam User',    email: 'spam@evil.com',     role: 'student',  city: 'Karachi',    university: 'Unknown',    rating: 0,   totalReviews: 0,  walletBalance: 0,     banned: true,  verified: false, createdAt: new Date(Date.now() - 5*86400000).toISOString() },
]

const ROLE_ICON: Record<string, any> = {
  admin:    Shield,
  student:  GraduationCap,
  executor: Briefcase,
}

const ROLE_COLOR: Record<string, string> = {
  admin:    '#f59e0b',
  student:  '#6271f4',
  executor: '#a855f7',
}

function UserRow({ user, onBan, onUnban }: { user: any; onBan: (id: string) => void; onUnban: (id: string) => void }) {
  const [loading, setLoading] = useState(false)
  const Icon = ROLE_ICON[user.role] || GraduationCap
  const color = ROLE_COLOR[user.role] || '#6271f4'

  const handleToggleBan = async () => {
    setLoading(true)
    if (user.banned) await onUnban(user._id)
    else             await onBan(user._id)
    setLoading(false)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl transition-colors"
         style={{ background: user.banned ? 'rgba(244,63,94,0.04)' : 'var(--bg-tertiary)' }}>

      {/* Avatar + Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
               style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
            {user.name.charAt(0)}
          </div>
          {user.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                 style={{ background: '#10b981' }}>
              <UserCheck size={9} className="text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {user.name}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-display font-bold"
                  style={{ background: `${color}15`, color }}>
              <Icon size={9} />
              {user.role}
            </span>
            {user.banned && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold badge-rejected">
                Banned
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {user.email} · {user.city}, {user.university}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        {user.role === 'executor' && (
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-400" />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.rating}</span>
            <span>({user.totalReviews})</span>
          </div>
        )}
        <div>
          <span className="font-semibold" style={{ color: 'var(--brand)' }}>₨ {user.walletBalance.toLocaleString()}</span>
        </div>
        <div className="hidden sm:block">
          Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="p-2 rounded-xl transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          <Eye size={14} />
        </button>
        <button onClick={handleToggleBan} disabled={loading || user.role === 'admin'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-semibold transition-all duration-200 disabled:opacity-40"
                style={{
                  background: user.banned ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                  color:      user.banned ? '#10b981' : '#f43f5e',
                }}>
          {loading
            ? <RefreshCw size={12} className="animate-spin" />
            : user.banned
              ? <><UserCheck size={12} /> Unban</>
              : <><UserX size={12} /> Ban</>
          }
        </button>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers]   = useState(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const displayed = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleBan = async (id: string) => {
    try {
      await adminAPI.banUser(id)
      setUsers(p => p.map(u => u._id === id ? { ...u, banned: true } : u))
      toast.success('User banned.')
    } catch {
      toast.error('Failed to ban user.')
    }
  }

  const handleUnban = async (id: string) => {
    try {
      await adminAPI.unbanUser(id)
      setUsers(p => p.map(u => u._id === id ? { ...u, banned: false } : u))
      toast.success('User unbanned.')
    } catch {
      toast.error('Failed to unban user.')
    }
  }

  // Stats summary
  const counts = {
    total:    users.length,
    students: users.filter(u => u.role === 'student').length,
    executors:users.filter(u => u.role === 'executor').length,
    banned:   users.filter(u => u.banned).length,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
          User Management
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage all platform users
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',  value: counts.total,     color: '#6271f4', filter: 'all' },
          { label: 'Students',     value: counts.students,  color: '#22d3ee', filter: 'student' },
          { label: 'Executors',    value: counts.executors, color: '#a855f7', filter: 'executor' },
          { label: 'Banned',       value: counts.banned,    color: '#f43f5e', filter: 'banned' },
        ].map(({ label, value, color, filter }) => (
          <button key={label} onClick={() => setRoleFilter(filter === 'banned' ? 'all' : filter)}
                  className="glass-card p-4 text-left hover:scale-[1.02] transition-all duration-200">
            <div className="font-display font-bold text-2xl mb-1" style={{ color }}>
              {value}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by name or email..."
                 value={search} onChange={e => setSearch(e.target.value)}
                 className="input-field pl-11 py-2.5" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {['all', 'student', 'executor', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
                    className="px-3 py-2.5 rounded-xl text-xs font-display font-semibold capitalize transition-all duration-200"
                    style={{
                      background: roleFilter === r ? 'var(--brand)' : 'var(--bg-tertiary)',
                      color:      roleFilter === r ? '#fff' : 'var(--text-secondary)',
                    }}>
              {r === 'all' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
            {displayed.length} user{displayed.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {displayed.length === 0 ? (
          <div className="text-center py-12">
            <Search size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-display font-medium" style={{ color: 'var(--text-secondary)' }}>No users found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(u => (
              <UserRow key={u._id} user={u} onBan={handleBan} onUnban={handleUnban} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
