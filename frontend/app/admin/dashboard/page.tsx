'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, BookOpen, DollarSign, ShieldCheck, TrendingUp,
  ArrowRight, AlertTriangle, CheckCircle, XCircle, Clock,
  Activity, Eye, Ban, RefreshCw
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { format } from 'date-fns'

// ─── Mock Data ───────────────────────────────────────────
const revenueData = [
  { month: 'Jan', revenue: 42000, assignments: 38 },
  { month: 'Feb', revenue: 58000, assignments: 52 },
  { month: 'Mar', revenue: 51000, assignments: 45 },
  { month: 'Apr', revenue: 76000, assignments: 68 },
  { month: 'May', revenue: 89000, assignments: 81 },
  { month: 'Jun', revenue: 104000, assignments: 95 },
  { month: 'Jul', revenue: 118000, assignments: 107 },
]

const roleDistribution = [
  { name: 'Students',  value: 68, color: '#6271f4' },
  { name: 'Executors', value: 28, color: '#a855f7' },
  { name: 'Admins',    value: 4,  color: '#f59e0b' },
]

const pendingApprovals = [
  { id: 'p1', title: 'Machine Learning Report', student: 'Ahmed K.', executor: 'Bilal R.', budget: 4500, submittedAt: new Date(Date.now() - 2*3600000).toISOString(), aiScore: 96, plagiarism: 2 },
  { id: 'p2', title: 'Economics Case Study', student: 'Sara M.', executor: 'Zara A.', budget: 2800, submittedAt: new Date(Date.now() - 5*3600000).toISOString(), aiScore: 88, plagiarism: 5 },
  { id: 'p3', title: 'Chemistry Lab Report', student: 'Hamza T.', executor: 'Nida Q.', budget: 1500, submittedAt: new Date(Date.now() - 1*3600000).toISOString(), aiScore: 92, plagiarism: 1 },
  { id: 'p4', title: 'Business Strategy Plan', student: 'Fatima L.', executor: 'Omar S.', budget: 6000, submittedAt: new Date(Date.now() - 8*3600000).toISOString(), aiScore: 79, plagiarism: 12 },
]

const recentLogs = [
  { id: 'l1', action: 'Assignment Approved', user: 'Admin', target: 'ML Report', time: new Date(Date.now() - 10*60000).toISOString(), type: 'success' },
  { id: 'l2', action: 'User Banned', user: 'Admin', target: 'spammer@email.com', time: new Date(Date.now() - 25*60000).toISOString(), type: 'warning' },
  { id: 'l3', action: 'Payment Released', user: 'System', target: '₨ 4,275 to Bilal R.', time: new Date(Date.now() - 40*60000).toISOString(), type: 'success' },
  { id: 'l4', action: 'Fraud Detected', user: 'AI System', target: 'Suspicious transaction', time: new Date(Date.now() - 60*60000).toISOString(), type: 'error' },
  { id: 'l5', action: 'New User Registered', user: 'System', target: 'student@fast.edu', time: new Date(Date.now() - 90*60000).toISOString(), type: 'info' },
]

// ─── Stat Card ───────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, glow, trend, trendUp }: any) {
  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10"
           style={{ background: color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between mb-4 relative">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
             style={{ background: `${color}20`, boxShadow: `0 4px 16px ${glow}` }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            <TrendingUp size={11} className={trendUp ? '' : 'rotate-180'} />
            {trend}
          </span>
        )}
      </div>
      <div className="font-display font-bold text-2xl sm:text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

// ─── Custom Tooltip ──────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-4 py-3 text-sm" style={{ minWidth: 140 }}>
      <p className="font-display font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-semibold">
            {p.name === 'revenue' ? `₨ ${p.value.toLocaleString()}` : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Approval Row ────────────────────────────────────────
function ApprovalRow({ item, onApprove, onReject }: any) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const plagiarismColor =
    item.plagiarism <= 5 ? '#10b981' : item.plagiarism <= 15 ? '#f59e0b' : '#f43f5e'

  const aiScoreColor =
    item.aiScore >= 90 ? '#10b981' : item.aiScore >= 75 ? '#f59e0b' : '#f43f5e'

  return (
    <div className="p-4 rounded-xl transition-colors" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </div>
          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Student: <strong style={{ color: 'var(--text-secondary)' }}>{item.student}</strong></span>
            <span>Executor: <strong style={{ color: 'var(--text-secondary)' }}>{item.executor}</strong></span>
            <span>Budget: <strong style={{ color: 'var(--brand)' }}>₨ {item.budget.toLocaleString()}</strong></span>
          </div>

          {/* AI Scores */}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span style={{ color: 'var(--text-muted)' }}>AI Score:</span>
              <span className="font-bold" style={{ color: aiScoreColor }}>{item.aiScore}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span style={{ color: 'var(--text-muted)' }}>Plagiarism:</span>
              <span className="font-bold" style={{ color: plagiarismColor }}>{item.plagiarism}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock size={11} />
              {format(new Date(item.submittedAt), 'HH:mm')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => { setLoading('approve'); onApprove(item.id) }}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-semibold transition-all duration-200"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            {loading === 'approve'
              ? <RefreshCw size={13} className="animate-spin" />
              : <CheckCircle size={13} />}
            Approve
          </button>
          <button
            onClick={() => { setLoading('reject'); onReject(item.id) }}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-semibold transition-all duration-200"
            style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
            {loading === 'reject'
              ? <RefreshCw size={13} className="animate-spin" />
              : <XCircle size={13} />}
            Reject
          </button>
          <Link href={`/admin/approvals/${item.id}`}
                className="p-2 rounded-xl transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            <Eye size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Log Row ─────────────────────────────────────────────
const LOG_COLORS: Record<string, string> = {
  success: '#10b981', warning: '#f59e0b', error: '#f43f5e', info: '#6271f4',
}

function LogRow({ log }: { log: any }) {
  const color = LOG_COLORS[log.type] || '#6271f4'
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-display font-medium" style={{ color: 'var(--text-primary)' }}>
          {log.action}
        </span>
        <span className="text-xs mx-2" style={{ color: 'var(--text-muted)' }}>→</span>
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{log.target}</span>
      </div>
      <div className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
        {format(new Date(log.time), 'HH:mm')}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────
export default function AdminDashboard() {
  const [approvals, setApprovals] = useState(pendingApprovals)

  const handleApprove = (id: string) => {
    setTimeout(() => setApprovals(p => p.filter(a => a.id !== id)), 800)
  }

  const handleReject = (id: string) => {
    setTimeout(() => setApprovals(p => p.filter(a => a.id !== id)), 800)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            Admin Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Platform overview — {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-semibold"
             style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          All Systems Operational
        </div>
      </div>

      {/* Fraud Alert */}
      {approvals.some(a => a.plagiarism > 10) && (
        <div className="flex items-center gap-3 p-4 rounded-xl"
             style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <AlertTriangle size={18} className="text-rose-500 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              High Plagiarism Detected
            </span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
              1 submission has {'>'}10% plagiarism — review before approving.
            </span>
          </div>
          <Link href="/admin/fraud" className="text-xs font-semibold" style={{ color: '#f43f5e' }}>
            View Details
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="Total Users"        value="4,821"    sub="↑ 124 this week"  color="#6271f4" glow="rgba(98,113,244,0.3)"   trend="+8.2%" trendUp />
        <StatCard icon={BookOpen}   label="Assignments"        value="1,204"    sub="48 active now"    color="#a855f7" glow="rgba(168,85,247,0.3)"  trend="+14%" trendUp />
        <StatCard icon={DollarSign} label="Revenue (Month)"    value="₨ 1.04L"  sub="After commissions" color="#10b981" glow="rgba(16,185,129,0.3)"  trend="+22%" trendUp />
        <StatCard icon={ShieldCheck} label="Pending Approvals" value={approvals.length} sub="Needs review" color="#f59e0b" glow="rgba(245,158,11,0.3)" trend={approvals.length > 2 ? 'High' : 'Normal'} trendUp={false} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              Revenue & Assignments
            </h2>
            <span className="badge badge-done text-xs">Last 7 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6271f4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6271f4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAssign" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue"     stroke="#6271f4" fill="url(#colorRevenue)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="assignments" stroke="#a855f7" fill="url(#colorAssign)"  strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Pie */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
            User Distribution
          </h2>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie data={roleDistribution} cx={75} cy={75} innerRadius={50} outerRadius={75}
                   paddingAngle={4} dataKey="value">
                {roleDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-3 mt-4">
            {roleDistribution.map(r => (
              <div key={r.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                </div>
                <span className="text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                  {r.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              Pending Approvals
            </h2>
            {approvals.length > 0 && (
              <span className="badge badge-pending">{approvals.length} waiting</span>
            )}
          </div>
          <Link href="/admin/approvals" className="text-sm flex items-center gap-1" style={{ color: 'var(--brand)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {approvals.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle size={32} className="mx-auto mb-3 text-emerald-500" />
            <p className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>All caught up!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map(item => (
              <ApprovalRow key={item.id} item={item} onApprove={handleApprove} onReject={handleReject} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Log */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              <Activity size={16} className="inline mr-2 text-brand-400" />
              Recent Activity
            </h2>
            <Link href="/admin/logs" className="text-xs" style={{ color: 'var(--brand)' }}>View all</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {recentLogs.map(log => <LogRow key={log.id} log={log} />)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-5">
          <h2 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/users',       label: 'Manage Users',       icon: Users,       color: '#6271f4' },
              { href: '/admin/assignments', label: 'All Assignments',    icon: BookOpen,    color: '#a855f7' },
              { href: '/admin/payments',    label: 'Payment Dashboard',  icon: DollarSign,  color: '#10b981' },
              { href: '/admin/fraud',       label: 'Fraud Alerts',      icon: AlertTriangle, color: '#f43f5e' },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}
                    className="glass-card p-4 flex flex-col items-center gap-2 text-center group hover:scale-[1.02] transition-all duration-200">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                     style={{ background: `${color}20` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-xs font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
