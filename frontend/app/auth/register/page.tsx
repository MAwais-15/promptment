'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ArrowRight, Zap, GraduationCap, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type RegisterForm = {
  name: string
  email: string
  password: string
  role: 'student' | 'executor'
  city: string
  university: string
  referralCode?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'student' | 'executor'>('student')

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>({
    defaultValues: { role: 'student' }
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      data.role = selectedRole
      const res = await authAPI.register(data)
      setToken(res.data.token)
      setUser(res.data.user)

      toast.success('Account created successfully!')
      
      if (res.data.user.role === 'student') router.push('/student/dashboard')
      else router.push('/executor/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0e0f1e 0%, #1a1c2e 100%)' }}>
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
            Join the Future of<br />
            <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #8196fa, #c084fc)' }}>
              Learning & Earning
            </span>
          </h2>
          <p className="text-surface-200 leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Whether you need help with an assignment or want to earn by helping others, 
            Promptment connects you with the right people.
          </p>

          <div className="glass-card p-5">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Zap key={i} size={14} className="text-amber-400" fill="currentColor" />
              ))}
            </div>
            <p className="text-sm italic mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
              "I started as a student needing help, and now I'm an executor earning a 
              steady income. The platform is secure, fast, and reliable."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              <div>
                <div className="text-sm font-display font-semibold text-white">Mohammed A.</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>LUMS Lahore</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © {new Date().getFullYear()} Promptment. Secure & trusted.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md animate-slide-up py-8">
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm"
                 style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>P</div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              Prompt<span className="text-brand-500">ment</span>
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Create an account
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start your journey with us today
          </p>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSelectedRole('student')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                selectedRole === 'student'
                  ? 'border-brand-500 bg-brand-50/10'
                  : 'border-transparent bg-surface-100 hover:bg-surface-200'
              }`}
              style={{
                borderColor: selectedRole === 'student' ? 'var(--brand)' : 'var(--border-color)',
                background: selectedRole === 'student' ? 'rgba(98,113,244,0.05)' : 'var(--bg-tertiary)'
              }}
            >
              <GraduationCap size={24} style={{ color: selectedRole === 'student' ? 'var(--brand)' : 'var(--text-secondary)' }} />
              <span className="font-semibold text-sm" style={{ color: selectedRole === 'student' ? 'var(--brand)' : 'var(--text-primary)' }}>Student</span>
            </button>
            <button
              onClick={() => setSelectedRole('executor')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                selectedRole === 'executor'
                  ? 'border-purple-500 bg-purple-50/10'
                  : 'border-transparent bg-surface-100 hover:bg-surface-200'
              }`}
              style={{
                borderColor: selectedRole === 'executor' ? '#a855f7' : 'var(--border-color)',
                background: selectedRole === 'executor' ? 'rgba(168,85,247,0.05)' : 'var(--bg-tertiary)'
              }}
            >
              <Briefcase size={24} style={{ color: selectedRole === 'executor' ? '#a855f7' : 'var(--text-secondary)' }} />
              <span className="font-semibold text-sm" style={{ color: selectedRole === 'executor' ? '#a855f7' : 'var(--text-primary)' }}>Executor</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Full Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="John Doe"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Email address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
                })}
              />
              {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Must be at least 6 characters' }
                  })}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text-muted)' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  City
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Lahore"
                  {...register('city', { required: 'City is required' })}
                />
                {errors.city && <p className="text-rose-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  University
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. LUMS"
                  {...register('university', { required: 'University is required' })}
                />
                {errors.university && <p className="text-rose-500 text-xs mt-1">{errors.university.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                Referral Code (Optional)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="PROMPT123"
                {...register('referralCode')}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold transition-colors" style={{ color: 'var(--brand)' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}