'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Zap, Shield, Clock, Star, ArrowRight, CheckCircle,
  BookOpen, Users, CreditCard, Brain, MapPin, ChevronDown,
  GraduationCap, Briefcase, Moon, Sun, Menu, X
} from 'lucide-react'

// ─── Theme Hook ─────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.classList.toggle('light', next === 'light')
  }

  return { theme, toggle }
}

// ─── Data ────────────────────────────────────────────────
const features = [
  {
    icon: Brain,
    title: 'AI Verification',
    desc: 'Every submission is automatically checked for plagiarism and originality before delivery.',
    color: 'from-violet-500 to-purple-600',
    glow: 'rgba(168,85,247,0.3)',
  },
  {
    icon: Shield,
    title: 'Escrow Payments',
    desc: 'Funds are held securely until you approve the work. No risk, full control.',
    color: 'from-brand-500 to-blue-600',
    glow: 'rgba(98,113,244,0.3)',
  },
  {
    icon: Zap,
    title: 'Real-Time Chat',
    desc: 'Communicate instantly with your executor. Stay updated every step of the way.',
    color: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    icon: MapPin,
    title: 'Location-Aware',
    desc: 'Physical assignments are matched to executors in your city and university.',
    color: 'from-rose-500 to-pink-600',
    glow: 'rgba(244,63,94,0.3)',
  },
  {
    icon: CreditCard,
    title: 'Flexible Payments',
    desc: 'Pay with crypto, EasyPaisa, JazzCash, or direct bank transfer.',
    color: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    icon: Star,
    title: 'Rated Executors',
    desc: 'Browse rated and reviewed executors. Quality guaranteed by community trust.',
    color: 'from-cyan-500 to-sky-600',
    glow: 'rgba(34,211,238,0.3)',
  },
]

const steps = [
  { n: '01', title: 'Post Your Assignment', desc: 'Describe your task, set a budget, upload files, and choose digital or physical delivery.' },
  { n: '02', title: 'Match with Executor', desc: 'Our system matches you with qualified executors. Review profiles and select your match.' },
  { n: '03', title: 'Track Progress', desc: 'Monitor real-time status updates and chat directly with your executor.' },
  { n: '04', title: 'Approve & Pay', desc: 'Review AI-verified work, approve it, and payment is automatically released.' },
]

const stats = [
  { val: '12,000+', label: 'Assignments Completed' },
  { val: '4,800+', label: 'Active Executors' },
  { val: '98.2%', label: 'Satisfaction Rate' },
  { val: '< 2hr',  label: 'Avg. Response Time' },
]

// ─── Navbar ──────────────────────────────────────────────
function Navbar({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-3 backdrop-blur-xl border-b' : 'py-5'
      }`}
      style={{
        background: scrolled ? 'var(--glass-bg)' : 'transparent',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-display font-bold"
               style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>
            P
          </div>
          <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            Prompt<span className="text-brand-500">ment</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Pricing', 'About'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
               className="text-sm font-display font-medium transition-colors duration-200"
               style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--brand)'}
               onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--text-secondary)'}>
              {l}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link href="/auth/login" className="btn-secondary hidden sm:inline-flex py-2 px-4 text-sm">
            Sign In
          </Link>
          <Link href="/auth/register" className="btn-primary py-2 px-4 text-sm">
            Get Started
          </Link>
          <button className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 mx-4 glass-card p-4 space-y-2">
          {['Features', 'How It Works', 'Pricing', 'About'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`}
               onClick={() => setMenuOpen(false)}
               className="block px-4 py-2.5 rounded-lg text-sm font-display font-medium transition-colors"
               style={{ color: 'var(--text-secondary)' }}>
              {l}
            </a>
          ))}
          <div className="pt-2 border-t flex gap-2" style={{ borderColor: 'var(--border-color)' }}>
            <Link href="/auth/login" className="btn-secondary flex-1 py-2 text-sm">Sign In</Link>
            <Link href="/auth/register" className="btn-primary flex-1 py-2 text-sm">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
             style={{ background: 'radial-gradient(circle, #6271f4, transparent)' }} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl animate-float"
             style={{ background: 'radial-gradient(circle, #a855f7, transparent)', animationDelay: '-2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-10 blur-3xl animate-float"
             style={{ background: 'radial-gradient(circle, #22d3ee, transparent)', animationDelay: '-4s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{
               backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
               backgroundSize: '64px 64px',
             }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-display font-semibold mb-8 animate-slide-up"
             style={{
               background: 'linear-gradient(135deg, rgba(98,113,244,0.15), rgba(168,85,247,0.1))',
               border: '1px solid rgba(98,113,244,0.3)',
               color: '#8196fa',
             }}>
          <Zap size={12} fill="currentColor" />
          AI-Powered Assignment Marketplace
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6"
            style={{ color: 'var(--text-primary)', animationDelay: '0.1s' }}>
          Your Assignments,{' '}
          <span className="relative inline-block">
            <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #6271f4, #a855f7, #22d3ee)' }}>
              Done Right
            </span>
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 300 6">
              <path d="M0 3 Q75 0 150 3 Q225 6 300 3" stroke="url(#grad)" strokeWidth="2.5" fill="none" strokeLinecap="round">
                <animate attributeName="d" dur="3s" repeatCount="indefinite"
                  values="M0 3 Q75 0 150 3 Q225 6 300 3;M0 3 Q75 6 150 3 Q225 0 300 3;M0 3 Q75 0 150 3 Q225 6 300 3" />
              </path>
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6271f4" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
           style={{ color: 'var(--text-secondary)' }}>
          Connect with skilled executors, track progress in real-time, and receive verified,
          AI-checked work — all secured by escrow payments.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/auth/register?role=student" className="btn-primary text-base px-8 py-4 w-full sm:w-auto">
            Post an Assignment
            <ArrowRight size={18} />
          </Link>
          <Link href="/auth/register?role=executor" className="btn-secondary text-base px-8 py-4 w-full sm:w-auto">
            <Briefcase size={18} />
            Become an Executor
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="font-display font-bold text-2xl sm:text-3xl bg-clip-text text-transparent"
                   style={{ backgroundImage: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>
                {s.val}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="mt-16 flex flex-col items-center gap-2 opacity-50">
          <span className="text-xs font-display" style={{ color: 'var(--text-muted)' }}>Scroll to explore</span>
          <ChevronDown size={16} className="animate-bounce" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>
    </section>
  )
}

// ─── Features ────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-active mb-4">Features</span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4" style={{ color: 'var(--text-primary)' }}>
            Built for the Modern Student
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Every feature is designed to make assignment delivery seamless, secure, and smart.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={f.title}
                 className="glass-card p-6 group hover:scale-[1.02] transition-all duration-300 cursor-default"
                 style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
                   style={{ boxShadow: `0 8px 24px ${f.glow}` }}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6" style={{ background: 'var(--bg-secondary)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-progress mb-4">Process</span>
          <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4" style={{ color: 'var(--text-primary)' }}>
            How It Works
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Four simple steps to getting your assignment done professionally.
          </p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-0.5"
               style={{ background: 'linear-gradient(90deg, #6271f4, #a855f7, #22d3ee)' }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={s.n} className="flex flex-col items-center text-center">
                <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 font-display font-bold text-2xl text-white"
                     style={{
                       background: `linear-gradient(135deg, #6271f4, #a855f7)`,
                       boxShadow: '0 8px 24px rgba(98,113,244,0.4)',
                     }}>
                  {s.n}
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 text-white flex items-center justify-center text-xs">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Roles CTA ───────────────────────────────────────────
function RolesCTA() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Card */}
          <div className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                 style={{ background: 'radial-gradient(circle at 70% 30%, rgba(98,113,244,0.1), transparent 70%)' }} />
            <GraduationCap size={40} className="mb-6 text-brand-400" />
            <h3 className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
              For Students
            </h3>
            <p className="mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Post your assignments, connect with verified executors, and receive AI-validated, plagiarism-free work on time.
            </p>
            <ul className="space-y-2 mb-8">
              {['Post digital & physical assignments', 'Real-time status tracking', 'Secure escrow payments', 'Download verified results'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=student" className="btn-primary w-full justify-center">
              Start as Student <ArrowRight size={16} />
            </Link>
          </div>

          {/* Executor Card */}
          <div className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                 style={{ background: 'radial-gradient(circle at 30% 70%, rgba(168,85,247,0.1), transparent 70%)' }} />
            <Briefcase size={40} className="mb-6 text-violet-400" />
            <h3 className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
              For Executors
            </h3>
            <p className="mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Browse assignments that match your skills and location. Earn money by helping students succeed.
            </p>
            <ul className="space-y-2 mb-8">
              {['Browse filtered assignments', 'Location-based matching', 'Upload and get paid instantly', 'Build your reputation'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle size={14} className="text-violet-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/auth/register?role=executor"
                  className="relative z-10 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl font-display font-semibold text-sm text-white transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
                  }}>
              Become an Executor <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-display font-bold"
                 style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>
              P
            </div>
            <span className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              Prompt<span className="text-brand-500">ment</span>
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            © 2024 Promptment. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" className="text-sm transition-colors duration-200"
                 style={{ color: 'var(--text-muted)' }}
                 onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--brand)'}
                 onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--text-muted)'}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ────────────────────────────────────────────────
export default function LandingPage() {
  const { theme, toggle } = useTheme()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <main className="relative noise">
      <Navbar theme={theme} toggleTheme={toggle} />
      <Hero />
      <Features />
      <HowItWorks />
      <RolesCTA />
      <Footer />
    </main>
  )
}
