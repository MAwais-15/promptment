'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen, Clock, CheckCircle, DollarSign, TrendingUp,
  ArrowRight, Plus, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { assignmentAPI, paymentAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

// ─── Status Badge ────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  pending:    { label: 'Pending',     className: 'badge-pending',  dot: 'bg-amber-400' },
  accepted:   { label: 'Accepted',    className: 'badge-active',   dot: 'bg-blue-400' },
  inprogress: { label: 'In Progress', className: 'badge-progress', dot: 'bg-violet-400' },
  completed:  { label: 'Completed',   className: 'badge-done',     dot: 'bg-emerald-400' },
  approved:   { label: 'Approved',    className: 'badge-done',     dot: 'bg-emerald-400' },
  rejected:   { label: 'Rejected',    className: 'badge-rejected', dot: 'bg-rose-400' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={cfg.className}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  )
}

// ─── Status Tracker ──────────────────────────────────────
const STEPS = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Approved']
const STEP_MAP: Record<string, number> = {
  pending: 0, accepted: 1, inprogress: 2, completed: 3, approved: 4,
}

function StatusTracker({ status }: { status: string }) {
  const current = STEP_MAP[status] ?? 0
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className={`status-dot w-6 h-6 text-[10px] ${
            i < current ? 'completed' : i === current ? 'current' : 'pending'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-6 h-0.5 rounded" style={{
              background: i < current
                ? 'linear-gradient(90deg, #10b981, #059669)'
                : 'var(--border-color)',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, glow }: any) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: `${color}20`, boxShadow: `0 4px 12px ${glow}` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <TrendingUp size={14} className="text-emerald-500" />
      </div>
      <div className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

// ─── Assignment Row ──────────────────────────────────────
function AssignmentRow({ a }: { a: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl transition-colors"
         style={{ background: 'var(--bg-tertiary)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {a.title}
          </span>
          <StatusBadge status={a.status} />
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            Due {format(new Date(a.deadline), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign size={11} />
            {a.budget} PKR
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                style={{ background: a.type === 'digital' ? 'rgba(98,113,244,0.15)' : 'rgba(245,158,11,0.15)',
                         color: a.type === 'digital' ? '#8196fa' : '#f59e0b' }}>
            {a.type}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusTracker status={a.status} />
        <Link href={`/student/assignments/${a._id}`}
              className="p-2 rounded-lg transition-colors"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, spent: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [aRes] = await Promise.all([
          assignmentAPI.getMyAssignments({ page: 1 }),
        ])
        const all = aRes.data.assignments || []
        setAssignments(all.slice(0, 6))
        setStats({
          total:     all.length,
          active:    all.filter((a: any) => ['accepted','inprogress'].includes(a.status)).length,
          completed: all.filter((a: any) => a.status === 'approved').length,
          spent:     all.filter((a: any) => a.status === 'approved').reduce((s: number, a: any) => s + a.budget, 0),
        })
      } catch { /* use mock data in dev */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

 const displayAssignments = assignments
const displayStats = stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Track your assignments and manage your work
          </p>
        </div>
        <Link href="/student/post" className="btn-primary py-2.5 px-5 self-start">
          <Plus size={16} />
          New Assignment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Posted" value={displayStats.total}
                  sub="All time" color="#6271f4" glow="rgba(98,113,244,0.3)" />
        <StatCard icon={Clock} label="Active" value={displayStats.active}
                  sub="In progress" color="#f59e0b" glow="rgba(245,158,11,0.3)" />
        <StatCard icon={CheckCircle} label="Completed" value={displayStats.completed}
                  sub="Approved work" color="#10b981" glow="rgba(16,185,129,0.3)" />
        <StatCard icon={DollarSign} label="Total Spent" value={`${displayStats.spent.toLocaleString()} PKR`}
                  sub="On assignments" color="#a855f7" glow="rgba(168,85,247,0.3)" />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/student/post', icon: Plus, label: 'Post Assignment', desc: 'Create a new assignment request', color: '#6271f4' },
          { href: '/student/chat', icon: BookOpen, label: 'View Messages', desc: '3 unread messages', color: '#a855f7' },
          { href: '/student/payments', icon: DollarSign, label: 'Wallet Balance', desc: '4,200 PKR available', color: '#10b981' },
        ].map(({ href, icon: Icon, label, desc, color }) => (
          <Link key={href} href={href}
                className="glass-card p-5 flex items-center gap-4 group hover:scale-[1.02] transition-all duration-200">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                 style={{ background: `${color}20` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
            </div>
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
          </Link>
        ))}
      </div>

      {/* Recent Assignments */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Recent Assignments
          </h2>
          <Link href="/student/assignments" className="text-sm font-display font-medium flex items-center gap-1 transition-colors"
                style={{ color: 'var(--brand)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : displayAssignments.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-display font-medium" style={{ color: 'var(--text-secondary)' }}>No assignments yet</p>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>Post your first assignment to get started</p>
            <Link href="/student/post" className="btn-primary py-2 px-5 inline-flex">
              <Plus size={15} /> Post Assignment
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {displayAssignments.map(a => <AssignmentRow key={a._id} a={a} />)}
          </div>
        )}
      </div>
    </div>
  )
}
