'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DollarSign, Clock, Star, TrendingUp, ArrowRight,
  Search, MapPin, Monitor, CheckCircle, Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { assignmentAPI, paymentAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

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
            {a.budget?.toLocaleString()} PKR
          </div>
          <div className={`text-xs mt-0.5 ${urgent ? 'text-rose-500' : ''}`} style={urgent ? {} : { color: 'var(--text-muted)' }}>
            <Clock size={10} className="inline mr-0.5" />
            {a.deadline ? formatDistanceToNow(new Date(a.deadline), { addSuffix: true }) : 'N/A'}
          </div>
        </div>
      </div>
      {type === 'active' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            By {a.student?.name || 'Student'}
          </div>
          <Link href={`/executor/assignments/${a._id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold"
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
  const [available, setAvailable] = useState<any[]>([])
  const [active, setActive] = useState<any[]>([])
  const [wallet, setWallet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [myRes, browseRes, walletRes] = await Promise.allSettled([
          assignmentAPI.getMyAssignments(),
          assignmentAPI.getAll({ status: 'open', limit: 4 }),
          paymentAPI.getWalletBalance(),
        ])

        if (myRes.status === 'fulfilled') {
          const all = myRes.value.data?.data || []
          setActive(all.filter((a: any) => ['accepted', 'inprogress', 'submitted'].includes(a.status)))
        }
        if (browseRes.status === 'fulfilled') {
          setAvailable(browseRes.value.data?.data || [])
        }
        if (walletRes.status === 'fulfilled') {
          setWallet(walletRes.value.data?.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalEarned = wallet?.totalEarned || 0
  const completedJobs = wallet?.completedJobs || 0

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Earned" value={`Rs ${totalEarned.toLocaleString()}`} color="#10b981" glow="rgba(16,185,129,0.3)" />
        <StatCard icon={CheckCircle} label="Completed" value={completedJobs} color="#6271f4" glow="rgba(98,113,244,0.3)" />
        <StatCard icon={Clock} label="Active Jobs" value={active.length} color="#f59e0b" glow="rgba(245,158,11,0.3)" />
        <StatCard icon={Star} label="Rating" value={user?.rating?.toFixed(1) || '0.0'} color="#a855f7" glow="rgba(168,85,247,0.3)" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Active Work</h2>
          <Link href="/executor/assignments" className="text-sm flex items-center gap-1" style={{ color: 'var(--brand)' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : active.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p style={{ color: 'var(--text-muted)' }}>No active work yet. Browse assignments to get started!</p>
            <Link href="/executor/browse" className="btn-primary mt-4 inline-flex">Browse Assignments</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {active.map(a => <AssignmentCard key={a._id} a={a} type="active" />)}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            Available Assignments
          </h2>
          <Link href="/executor/browse" className="text-sm flex items-center gap-1" style={{ color: 'var(--brand)' }}>
            Browse all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : available.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p style={{ color: 'var(--text-muted)' }}>No assignments available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {available.slice(0, 4).map(a => <AssignmentCard key={a._id} a={a} type="browse" />)}
          </div>
        )}
      </div>
    </div>
  )
}