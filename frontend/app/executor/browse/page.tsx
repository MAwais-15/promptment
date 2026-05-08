'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search, Filter, Clock, DollarSign, MapPin, Monitor,
  Zap, ChevronDown, X, SlidersHorizontal, BookOpen, RefreshCw
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { assignmentAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'Engineering', 'Business', 'Literature', 'History',
  'Economics', 'Psychology', 'Law', 'Medicine', 'Architecture', 'Other',
]

const SORT_OPTIONS = [
  { label: 'Newest First',      value: '-createdAt' },
  { label: 'Deadline (Soonest)', value: 'deadline' },
  { label: 'Budget (High→Low)', value: '-budget' },
  { label: 'Budget (Low→High)', value: 'budget' },
]

// Mock assignments for development
const MOCK_ASSIGNMENTS = [
  {
    _id: '1', title: 'Python Flask REST API with JWT Auth', category: 'Computer Science',
    type: 'digital', budget: 4500, deadline: new Date(Date.now() + 3*86400000).toISOString(),
    status: 'pending', applicants: [{ executor: 'x' }, { executor: 'y' }],
    student: { name: 'Ahmed K.', rating: 4.8, city: 'Karachi', university: 'FAST NUCES' },
    description: 'Build a complete REST API with authentication, CRUD for users and posts, with unit tests.',
    createdAt: new Date(Date.now() - 2*3600000).toISOString(),
  },
  {
    _id: '2', title: 'Economics Research Essay — GDP & Inflation', category: 'Economics',
    type: 'digital', budget: 2200, deadline: new Date(Date.now() + 5*86400000).toISOString(),
    status: 'pending', applicants: [],
    student: { name: 'Sara M.', rating: 4.5, city: 'Lahore', university: 'LUMS' },
    description: '3000-word research essay on the relationship between GDP growth and inflation in South Asia (2015–2024).',
    createdAt: new Date(Date.now() - 4*3600000).toISOString(),
  },
  {
    _id: '3', title: 'Circuit Design — Op-Amp Lab Report', category: 'Engineering',
    type: 'physical', budget: 2800, deadline: new Date(Date.now() + 1*86400000).toISOString(),
    status: 'pending', applicants: [{ executor: 'x' }],
    student: { name: 'Hamza T.', rating: 4.2, city: 'Karachi', university: 'FAST NUCES' },
    description: 'Design and simulate inverting, non-inverting, and differential op-amp circuits. Submit LTSpice files and report.',
    createdAt: new Date(Date.now() - 1*3600000).toISOString(),
  },
  {
    _id: '4', title: 'Machine Learning — Image Classification CNN', category: 'Computer Science',
    type: 'digital', budget: 6000, deadline: new Date(Date.now() + 7*86400000).toISOString(),
    status: 'pending', applicants: [{ executor: 'a' }, { executor: 'b' }, { executor: 'c' }],
    student: { name: 'Fatima L.', rating: 4.9, city: 'Islamabad', university: 'NUST' },
    description: 'Build a CNN model for image classification on CIFAR-10. Accuracy >90%. Full documentation required.',
    createdAt: new Date(Date.now() - 6*3600000).toISOString(),
  },
  {
    _id: '5', title: 'Business Strategy Pitch Deck (15 slides)', category: 'Business',
    type: 'digital', budget: 3500, deadline: new Date(Date.now() + 4*86400000).toISOString(),
    status: 'pending', applicants: [],
    student: { name: 'Ali R.', rating: 4.7, city: 'Karachi', university: 'IBA' },
    description: 'Professional pitch deck for a SaaS startup. Market research, competitor analysis, financial projections required.',
    createdAt: new Date(Date.now() - 8*3600000).toISOString(),
  },
  {
    _id: '6', title: 'Calculus — Integration & Differentiation Problems', category: 'Mathematics',
    type: 'digital', budget: 800, deadline: new Date(Date.now() + 12*3600000).toISOString(),
    status: 'pending', applicants: [{ executor: 'x' }],
    student: { name: 'Nida Q.', rating: 4.3, city: 'Lahore', university: 'UET' },
    description: 'Solve 25 problems covering integration by parts, substitution, and differential equations. Show all steps.',
    createdAt: new Date(Date.now() - 30*60000).toISOString(),
  },
]

function AssignmentCard({ a, onApply }: { a: any; onApply: (id: string) => void }) {
  const [applying, setApplying] = useState(false)
  const urgent = new Date(a.deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
  const isNew  = new Date(a.createdAt) > new Date(Date.now() - 3 * 60 * 60 * 1000)

  const handleApply = async () => {
    setApplying(true)
    await onApply(a._id)
    setApplying(false)
  }

  return (
    <div className="glass-card p-5 hover:scale-[1.01] transition-all duration-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isNew && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                New
              </span>
            )}
            {urgent && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase"
                    style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>
                Urgent
              </span>
            )}
          </div>
          <h3 className="font-display font-semibold text-base leading-snug"
              style={{ color: 'var(--text-primary)' }}>
            {a.title}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-bold text-lg" style={{ color: 'var(--brand)' }}>
            ₨ {a.budget.toLocaleString()}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Net: ₨ {Math.round(a.budget * 0.95).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
        {a.description}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full"
              style={{ background: 'var(--bg-tertiary)' }}>
          <BookOpen size={11} /> {a.category}
        </span>
        <span className={`flex items-center gap-1.5 ${urgent ? 'text-rose-500' : ''}`}>
          <Clock size={11} />
          {formatDistanceToNow(new Date(a.deadline), { addSuffix: true })}
        </span>
        <span className="flex items-center gap-1.5">
          {a.type === 'digital' ? <Monitor size={11} /> : <MapPin size={11} />}
          {a.type === 'digital' ? 'Digital' : `${a.student?.city || 'Physical'}`}
        </span>
        <span>{a.applicants?.length || 0} applicant{a.applicants?.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Student info + CTA */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
               style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>
            {a.student?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <div className="text-xs font-display font-medium" style={{ color: 'var(--text-primary)' }}>
              {a.student?.name}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              ★ {a.student?.rating?.toFixed(1) || '—'} · {a.student?.university || ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/executor/browse/${a._id}`}
                className="px-3 py-1.5 rounded-xl text-xs font-display font-semibold transition-all duration-200 border"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
            Details
          </Link>
          <button onClick={handleApply} disabled={applying}
                  className="btn-primary py-1.5 px-4 text-xs">
            {applying
              ? <RefreshCw size={12} className="animate-spin" />
              : <><Zap size={12} /> Apply</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BrowseAssignmentsPage() {
  const { user } = useAuthStore()
  const [assignments, setAssignments] = useState<any[]>(MOCK_ASSIGNMENTS)
  const [loading, setLoading]         = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage]               = useState(1)
  const [total, setTotal]             = useState(MOCK_ASSIGNMENTS.length)

  const [filters, setFilters] = useState({
    search:    '',
    category:  'All',
    type:      '',
    minBudget: '',
    maxBudget: '',
    sort:      '-createdAt',
  })

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { status: 'pending', page, limit: 12, sort: filters.sort }
      if (filters.category !== 'All') params.category = filters.category
      if (filters.type)      params.type      = filters.type
      if (filters.minBudget) params.minBudget = filters.minBudget
      if (filters.maxBudget) params.maxBudget = filters.maxBudget

      const res = await assignmentAPI.getAll(params)
      setAssignments(res.data.assignments || [])
      setTotal(res.data.total || 0)
    } catch {
      // keep mock data in dev
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { fetchAssignments() }, [fetchAssignments])

  // Client-side search filter on mock data
  const displayed = assignments.filter(a =>
    !filters.search ||
    a.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    a.category.toLowerCase().includes(filters.search.toLowerCase())
  )

  const handleApply = async (id: string) => {
    try {
      await assignmentAPI.apply(id)
      toast.success('Application submitted! The student will review your profile.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to apply.')
    }
  }

  const clearFilters = () => {
    setFilters({ search: '', category: 'All', type: '', minBudget: '', maxBudget: '', sort: '-createdAt' })
    setPage(1)
  }

  const hasActiveFilters = filters.category !== 'All' || filters.type || filters.minBudget || filters.maxBudget

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            Browse Assignments
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {total} assignments available · {user?.city}, {user?.university}
          </p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary py-2 px-4 text-sm self-start sm:self-auto">
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-brand-500" />
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search assignments by title or category..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="input-field pl-11 pr-4"
        />
        {filters.search && (
          <button onClick={() => setFilters(f => ({ ...f, search: '' }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="glass-card p-5 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-display font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Category
              </label>
              <select className="input-field text-sm py-2"
                      value={filters.category}
                      onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-display font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Type
              </label>
              <select className="input-field text-sm py-2"
                      value={filters.type}
                      onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                <option value="">All Types</option>
                <option value="digital">Digital</option>
                <option value="physical">Physical</option>
              </select>
            </div>

            {/* Min Budget */}
            <div>
              <label className="block text-xs font-display font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Min Budget (PKR)
              </label>
              <input type="number" className="input-field text-sm py-2" placeholder="e.g. 500"
                     value={filters.minBudget}
                     onChange={e => setFilters(f => ({ ...f, minBudget: e.target.value }))} />
            </div>

            {/* Max Budget */}
            <div>
              <label className="block text-xs font-display font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                Max Budget (PKR)
              </label>
              <input type="number" className="input-field text-sm py-2" placeholder="e.g. 5000"
                     value={filters.maxBudget}
                     onChange={e => setFilters(f => ({ ...f, maxBudget: e.target.value }))} />
            </div>
          </div>

          {/* Sort + Clear */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t"
               style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <label className="text-xs font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Sort by:
              </label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value}
                          onClick={() => setFilters(f => ({ ...f, sort: opt.value }))}
                          className="px-3 py-1 rounded-full text-xs font-display font-semibold transition-all duration-200"
                          style={{
                            background: filters.sort === opt.value ? 'var(--brand)' : 'var(--bg-tertiary)',
                            color:      filters.sort === opt.value ? '#fff' : 'var(--text-secondary)',
                          }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-display font-semibold"
                      style={{ color: '#f43f5e' }}>
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.slice(0, 8).map(cat => (
          <button key={cat}
                  onClick={() => setFilters(f => ({ ...f, category: cat }))}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-all duration-200"
                  style={{
                    background: filters.category === cat ? 'var(--brand)' : 'var(--bg-tertiary)',
                    color:      filters.category === cat ? '#fff' : 'var(--text-secondary)',
                  }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-60 rounded-2xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <Search size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            No assignments found
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Try adjusting your filters or check back later
          </p>
          <button onClick={clearFilters} className="btn-primary py-2 px-5 inline-flex">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayed.map(a => (
              <AssignmentCard key={a._id} a={a} onApply={handleApply} />
            ))}
          </div>

          {/* Pagination */}
          {total > 12 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">
                Previous
              </button>
              <span className="text-sm px-4" style={{ color: 'var(--text-secondary)' }}>
                Page {page} of {Math.ceil(total / 12)}
              </span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)}
                      className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
