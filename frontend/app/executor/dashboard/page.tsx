'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DollarSign, Clock, Star, TrendingUp, ArrowRight,
  Search, MapPin, Monitor, CheckCircle, Zap
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { assignmentAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// Mock data
const MOCK_ACTIVE = [
  { _id: 'a1', title: 'Machine Learning Assignment', status: 'inprogress', budget: 3500, deadline: new Date(Date.now() + 2*86400000).toISOString(), type: 'digital', student: { name: 'Ahmed K.' } },
  { _id: 'a2', title: 'Business Report Q3', status: 'accepted', budget: 1800, deadline: new Date(Date.now() + 4*86400000).toISOString(), type: 'digital', student: { name: 'Sara M.' } },
]

const MOCK_AVAILABLE = [
  { _id: 'b1', title: 'Python Flask REST API', budget: 4500, deadline: new Date(Date.now() + 3*86400000).toISOString(), type: 'digital', category: 'Computer Science', applicants: 2, city: null },
  { _id: 'b2', title: 'Organic Chemistry Notes', budget: 1200, deadline: new Date(Date.now() + 1*86400000).toISOString(), type: 'physical', category: 'Chemistry', applicants: 0, city: 'Karachi' },
  { _id: 'b3', title: 'Economics Essay — GDP Analysis', budget: 2000, deadline: new Date(Date.now() + 5*86400000).toISOString(), type: 'digital', category: 'Economics', applicants: 5, city: null },
  { _id: 'b4', title: 'Marketing Research Survey', budget: 1600, deadline: new Date(Date.now() + 6*86400000).toISOString(), type: 'digital', category: 'Business', applicants: 1, city: null },
]

function StatCard({ icon: Icon, label, value, color, glow, trend }: any) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: `${color}20`, boxShadow: `0 4px 12px ${glow}` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
          <TrendingUp size={11} /> {trend}
        </span>}
      </div>
      <div className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  )
}

function AssignmentCard({ a, type }: { a: any; type: 'active' | 'browse' }) {
  const urgent = new Date(a.deadline) < new Date(Date.now() + 24*60*60*1000)

  return (
    <div className="glass-card p-5 hover:scale-[1.01] transition-all duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm truncate mb-1" style={{ color: 'var(--text-primary)' }}>
            {a.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {a.category && (
              <span className="px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                {a.category}
              </span>
            )}
            <span className="flex items-center gap-1">
              {a.type === 'digital' ? <Monitor size={11} /> : <MapPin size={11} />}
              {a.type === 'digital' ? 'Digital' : a.city || 'Physical'}
            </span>
            {a.applicants != null && (
              <span>{a.applicants} applicant{a.applicants !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-bold text-base" style={{ color: 'var(--brand)' }}>
            {a.budget.toLocaleString()} PKR
          </div>
          <div className={`text-xs mt-0.5 ${urgent ? 'text-rose-500' : ''}`} style={urgent ? {} : { color: 'var(--text-muted)' }}>
            <Clock size={10} className="inline mr-0.5" />
            {formatDistanceToNow(new Date(a.deadline), { addSuffix: true })}
          </div>
        </div>
      </div>

      {type === 'active' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            By {a.student?.name}
          </div>
          <Link href={`/executor/assignments/${a._id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all duration-200"
                style={{ background: 'rgba(98,113,244,0.1)', color: 'var(--brand)' }}>
            View Work <ArrowRight size={12} />
          </Link>
        </div>
      ) : (
        <Link href={`/executor/browse/${a._id}`}
              className="btn-primary w-full py-2 text-xs justify-center">
          <Zap size={13} /> Apply Now
        </Link>
      )}
    </div>
  )
}

export default function ExecutorDashboard() {
  const { user } = useAuthStore()
  const [available, setAvailable] = useState(MOCK_AVAILABLE)
  const [active, setActive] = useState(MOCK_ACTIVE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            Executor Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {user?.city} · {user?.university}
          </p>
        </div>
        <Link href="/executor/browse" className="btn-secondary py-2.5 px-5 self-start">
          <Search size={16} /> Browse All
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Earned" value="₨ 48,200" color="#10b981" glow="rgba(16,185,129,0.3)" trend="+12%" />
        <StatCard icon={CheckCircle} label="Completed" value="23" color="#6271f4" glow="rgba(98,113,244,0.3)" trend="+3" />
        <StatCard icon={Clock} label="Active Jobs" value={active.length} color="#f59e0b" glow="rgba(245,158,11,0.3)" />
        <StatCard icon={Star} label="Rating" value="4.8" color="#a855f7" glow="rgba(168,85,247,0.3)" trend="★ 4.8" />
      </div>

      {/* Earnings Summary */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>This Month's Earnings</h2>
          <span className="badge badge-done">+22% vs last month</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Gross Earned', value: '₨ 14,500' },
            { label: 'Platform Fee (5%)', value: '₨ 725' },
            { label: 'Net Received', value: '₨ 13,775' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Work */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Active Work</h2>
          <Link href="/executor/assignments" className="text-sm flex items-center gap-1" style={{ color: 'var(--brand)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {active.map(a => <AssignmentCard key={a._id} a={a} type="active" />)}
        </div>
      </div>

      {/* Available Assignments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Available Near You
          </h2>
          <Link href="/executor/browse" className="text-sm flex items-center gap-1" style={{ color: 'var(--brand)' }}>
            Browse all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {available.slice(0, 4).map(a => <AssignmentCard key={a._id} a={a} type="browse" />)}
        </div>
      </div>
    </div>
  )
}
