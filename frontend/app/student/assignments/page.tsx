'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus, Clock, DollarSign, ArrowRight, Monitor,
  MapPin, Search, CheckCircle, AlertCircle, Download
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const STATUS_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'accepted',   label: 'Accepted' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'completed',  label: 'Completed' },
  { key: 'approved',   label: 'Approved' },
]

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',     cls: 'badge-pending'  },
  accepted:   { label: 'Accepted',    cls: 'badge-active'   },
  inprogress: { label: 'In Progress', cls: 'badge-progress' },
  completed:  { label: 'Completed',   cls: 'badge-done'     },
  approved:   { label: 'Approved',    cls: 'badge-done'     },
  rejected:   { label: 'Rejected',    cls: 'badge-rejected' },
}

const MOCK_ASSIGNMENTS = [
  {
    _id: 'a1', title: 'Machine Learning Classification Model', status: 'inprogress',
    type: 'digital', budget: 4500, deadline: new Date(Date.now() + 2*86400000).toISOString(),
    createdAt: new Date(Date.now() - 3*86400000).toISOString(), category: 'Computer Science',
    executor: { name: 'Bilal R.', rating: 4.8 },
    aiValidation: null,
  },
  {
    _id: 'a2', title: 'Economics Essay — Inflation in Pakistan', status: 'pending',
    type: 'digital', budget: 2200, deadline: new Date(Date.now() + 5*86400000).toISOString(),
    createdAt: new Date(Date.now() - 1*86400000).toISOString(), category: 'Economics',
    executor: null, aiValidation: null,
  },
  {
    _id: 'a3', title: 'Data Structures Lab Report — AVL Trees', status: 'completed',
    type: 'digital', budget: 1800, deadline: new Date(Date.now() + 1*86400000).toISOString(),
    createdAt: new Date(Date.now() - 5*86400000).toISOString(), category: 'Computer Science',
    executor: { name: 'Zara A.', rating: 4.6 },
    aiValidation: { passed: true, plagiarismScore: 3, humanScore: 88 },
    submittedFiles: [{ name: 'AVL_Report_Final.pdf', url: '#' }],
  },
  {
    _id: 'a4', title: 'Calculus Problems — Integration Set', status: 'approved',
    type: 'digital', budget: 900, deadline: new Date(Date.now() - 1*86400000).toISOString(),
    createdAt: new Date(Date.now() - 7*86400000).toISOString(), category: 'Mathematics',
    executor: { name: 'Omar S.', rating: 4.9 },
    aiValidation: { passed: true, plagiarismScore: 1, humanScore: 95 },
    submittedFiles: [{ name: 'Calculus_Solutions.pdf', url: '#' }],
    escrowReleased: true,
  },
  {
    _id: 'a5', title: 'Circuit Design Lab — Op-Amp Configurations', status: 'accepted',
    type: 'physical', budget: 2800, deadline: new Date(Date.now() + 4*86400000).toISOString(),
    createdAt: new Date(Date.now() - 2*86400000).toISOString(), category: 'Engineering',
    executor: { name: 'Nida Q.', rating: 4.4 }, city: 'Karachi', university: 'FAST NUCES',
    aiValidation: null,
  },
]

const STEPS = ['Pending', 'Accepted', 'In Progress', 'Completed', 'Approved']
const STEP_MAP: Record<string, number> = {
  pending: 0, accepted: 1, inprogress: 2, completed: 3, approved: 4,
}

function MiniTracker({ status }: { status: string }) {
  const current = STEP_MAP[status] ?? 0
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i <= current ? 'bg-brand-500' : ''
          }`} style={i > current ? { background: 'var(--border-color)' } : {}} />
          {i < STEPS.length - 1 && (
            <div className="w-3 h-0.5 rounded" style={{
              background: i < current ? 'var(--brand)' : 'var(--border-color)',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

function AssignmentCard({ a }: { a: any }) {
  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending
  const urgent = new Date(a.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000) && a.status !== 'approved'

  return (
    <div className="glass-card p-5 hover:scale-[1.005] transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cfg.cls}>{cfg.label}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-semibold uppercase"
                  style={{
                    background: a.type === 'digital' ? 'rgba(98,113,244,0.1)' : 'rgba(245,158,11,0.1)',
                    color:      a.type === 'digital' ? '#8196fa' : '#f59e0b',
                  }}>
              {a.type === 'digital' ? <><Monitor size={9} className="inline mr-0.5" />Digital</> : <><MapPin size={9} className="inline mr-0.5" />Physical</>}
            </span>
            {urgent && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold"
                    style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
                Urgent
              </span>
            )}
          </div>

          <h3 className="font-display font-semibold text-base mb-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
            {a.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Due {format(new Date(a.deadline), 'MMM d, yyyy')}
              {urgent && <span className="text-rose-500 ml-1">({formatDistanceToNow(new Date(a.deadline), { addSuffix: true })})</span>}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign size={11} />
              ₨ {a.budget.toLocaleString()}
            </span>
            <span>{a.category}</span>
          </div>

          {/* Progress tracker */}
          <MiniTracker status={a.status} />

          {/* Executor */}
          {a.executor && (
            <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                   style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                {a.executor.name.charAt(0)}
              </div>
              <span>Executor: <strong style={{ color: 'var(--text-secondary)' }}>{a.executor.name}</strong></span>
              <span>★ {a.executor.rating}</span>
            </div>
          )}

          {/* AI Validation badge */}
          {a.aiValidation?.checked && (
            <div className="flex items-center gap-2 mt-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-display font-semibold ${
                a.aiValidation.passed ? 'badge-done' : 'badge-rejected'
              }`}>
                {a.aiValidation.passed ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                AI {a.aiValidation.passed ? 'Passed' : 'Failed'}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Plagiarism: {a.aiValidation.plagiarismScore}% · Human: {a.aiValidation.humanScore}%
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <Link href={`/student/assignments/${a._id}`}
                className="btn-secondary py-2 px-4 text-xs">
            View Details <ArrowRight size={13} />
          </Link>

          {a.status === 'completed' && (
            <Link href={`/student/assignments/${a._id}`}
                  className="btn-primary py-2 px-4 text-xs">
              Review & Approve
            </Link>
          )}

          {a.status === 'approved' && a.submittedFiles?.length > 0 && (
            <a href={a.submittedFiles[0].url}
               className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-display font-semibold transition-all duration-200"
               style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <Download size={13} /> Download
            </a>
          )}

          {a.status === 'pending' && !a.executor && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Awaiting applicants
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function StudentAssignmentsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch]       = useState('')

  const filtered = MOCK_ASSIGNMENTS.filter(a => {
    const matchTab    = activeTab === 'all' || a.status === activeTab
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const counts: Record<string, number> = MOCK_ASSIGNMENTS.reduce((acc, a) => {
    acc.all = (acc.all || 0) + 1
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            My Assignments
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {MOCK_ASSIGNMENTS.length} total assignments
          </p>
        </div>
        <Link href="/student/post" className="btn-primary py-2.5 px-5 self-start">
          <Plus size={16} /> New Assignment
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Search assignments..."
               value={search} onChange={e => setSearch(e.target.value)}
               className="input-field pl-11 py-2.5" />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-display font-semibold transition-all duration-200"
                  style={{
                    background: activeTab === tab.key ? 'var(--brand)' : 'var(--bg-tertiary)',
                    color:      activeTab === tab.key ? '#fff' : 'var(--text-secondary)',
                  }}>
            {tab.label}
            {counts[tab.key] != null && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-white/20 text-white' : ''
              }`} style={activeTab !== tab.key ? { background: 'var(--bg-secondary)', color: 'var(--text-muted)' } : {}}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            No assignments found
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'all' ? 'Post your first assignment to get started.' : `No ${activeTab} assignments.`}
          </p>
          <Link href="/student/post" className="btn-primary py-2 px-5 inline-flex">
            <Plus size={15} /> Post Assignment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => <AssignmentCard key={a._id} a={a} />)}
        </div>
      )}
    </div>
  )
}
