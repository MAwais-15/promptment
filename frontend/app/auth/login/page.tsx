'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ArrowRight, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type LoginForm = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await authAPI.login(data)
      setToken(res.data.token)
      setUser(res.data.user)

      toast.success('Welcome back!')

      const role = res.data.user.role
      if (role === 'admin')    router.push('/admin/dashboard')
      else if (role === 'student')  router.push('/student/dashboard')
      else                     router.push('/executor/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0e0f1e 0%, #1a1c2e 100%)' }}>
        {/* Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, #6271f4, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl"
             style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />

        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold"
               style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>
            P
          </div>
          <span className="font-display font-bold text-xl text-white">
            Prompt<span className="text-brand-400">ment</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display font-bold text-4xl text-white mb-4 leading-tight">
            Your Assignments,<br />
            <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #8196fa, #c084fc)' }}>
              Done Right
            </span>
          </h2>
          <p className="text-surface-200 leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join thousands of students and executors on the most secure assignment marketplace.
          </p>

          {/* Testimonial */}
          <div className="glass-card p-5">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Zap key={i} size={14} className="text-amber-400" fill="currentColor" />
              ))}
            </div>
            <p className="text-sm italic mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
              "Got my thesis formatted and verified within 6 hours. The escrow system gave me
              complete peace of mind."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <div>
                <div className="text-sm font-display font-semibold text-white">Aisha M.</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>University of Karachi</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © 2024 Promptment. Secure & trusted.
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm"
                 style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>P</div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              Prompt<span className="text-brand-500">ment</span>
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-display font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Email address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
              />
              {errors.email && (
                <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-display font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>
              )}
              <div className="flex justify-end mt-1">
                <Link href="/auth/forgot-password" className="text-xs transition-colors"
                      style={{ color: 'var(--brand)' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-semibold transition-colors" style={{ color: 'var(--brand)' }}>
              Create one free
            </Link>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or continue as</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Admin', href: '/auth/login?demo=admin', color: '#f59e0b' },
              { label: 'Student', href: '/auth/login?demo=student', color: '#6271f4' },
              { label: 'Executor', href: '/auth/login?demo=executor', color: '#a855f7' },
            ].map(d => (
              <Link key={d.label} href={d.href}
                    className="py-2 px-3 rounded-xl text-xs font-display font-semibold text-center transition-all duration-200 border"
                    style={{
                      color: d.color,
                      borderColor: `${d.color}33`,
                      background: `${d.color}10`,
                    }}>
                {d.label} Demo
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
