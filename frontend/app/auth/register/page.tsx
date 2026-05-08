'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, ArrowRight, GraduationCap, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

type RegisterForm = {
  name: string
  email: string
  password: string
  confirmPassword: string
  city: string
  university: string
}

type Role = 'student' | 'executor'

export default function RegisterPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { setUser, setToken } = useAuthStore()

  const [role, setRole] = useState<Role>((params.get('role') as Role) || 'student')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const res = await authAPI.register({ ...data, role })
      setToken(res.data.token)
      setUser(res.data.user)
      toast.success('Account created! Welcome to Promptment.')
      router.push(role === 'student' ? '/student/dashboard' : '/executor/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #6271f4, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                 style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>P</div>
            <span className="font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              Prompt<span style={{ color: '#6271f4' }}>ment</span>
            </span>
          </Link>
          <h1 className="font-bold text-3xl mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Join the smartest assignment marketplace</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { r: 'student' as Role, label: 'I am a Student', sub: 'Post assignments', Icon: GraduationCap, color: '#6271f4' },
            { r: 'executor' as Role, label: 'I am an Executor', sub: 'Complete assignments', Icon: Briefcase, color: '#a855f7' },
          ].map(({ r, label, sub, Icon, color }) => (
            <button key={r} type="button" onClick={() => setRole(r)}
                    className="p-4 text-left transition-all duration-300 border-2 rounded-xl"
                    style={{ borderColor: role === r ? color : 'transparent', background: role === r ? `${color}15` : 'var(--bg-secondary)' }}>
              <Icon size={24} className="mb-2" style={{ color }} />
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Full Name</label>
            <input className="input-field w-full" placeholder="Ali Hassan"
                   {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })} />
            {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email</label>
            <input type="email" className="input-field w-full" placeholder="you@example.com"
                   {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
            {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>City</label>
              <input className="input-field w-full" placeholder="Karachi" {...register('city', { required: 'City is required' })} />
              {errors.city && <p className="text-rose-500 text-xs mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>University</label>
              <input className="input-field w-full" placeholder="FAST NUCES" {...register('university', { required: 'University is required' })} />
              {errors.university && <p className="text-rose-500 text-xs mt-1">{errors.university.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} className="input-field w-full pr-11" placeholder="Min 8 characters"
                     {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Confirm Password</label>
            <input type="password" className="input-field w-full" placeholder="Repeat your password"
                   {...register('confirmPassword', { required: 'Please confirm your password', validate: v => v === password || 'Passwords do not match' })} />
            {errors.confirmPassword && <p className="text-rose-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={loading}
                  className="w-full py-3.5 mt-2 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>
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

        <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold" style={{ color: '#6271f4' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
