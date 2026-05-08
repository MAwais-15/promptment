'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import {
  Upload, File, X, MapPin, Monitor, Calendar, DollarSign,
  ArrowRight, Info, CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { assignmentAPI } from '@/lib/api'

type AssignmentType = 'digital' | 'physical'

type FormData = {
  title: string
  description: string
  deadline: string
  budget: number
  type: AssignmentType
  category: string
  city?: string
  university?: string
}

const CATEGORIES = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Engineering', 'Business', 'Literature', 'History', 'Economics',
  'Psychology', 'Law', 'Medicine', 'Architecture', 'Other',
]

export default function PostAssignmentPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1=details, 2=requirements, 3=payment

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { type: 'digital', budget: 1000 },
  })

  const assignmentType = watch('type')
  const budget = watch('budget')

  // Dropzone
  const onDrop = useCallback((accepted: File[]) => {
    const valid = accepted.filter(f =>
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
       'application/vnd.openxmlformats-officedocument.presentationml.presentation',
       'image/jpeg', 'image/png'].includes(f.type)
    )
    if (valid.length !== accepted.length) toast.error('Some files were rejected. Only PDF, DOCX, PPT, and images are allowed.')
    setFiles(prev => [...prev, ...valid].slice(0, 5))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, maxSize: 20 * 1024 * 1024, maxFiles: 5,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
  })

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, String(v)) })
      files.forEach(f => fd.append('files', f))

      const res = await assignmentAPI.create(fd)
      toast.success('Assignment posted! Executors will start applying soon.')
      router.push(`/student/assignments/${res.data.assignment._id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to post assignment.')
    } finally {
      setLoading(false)
    }
  }

  // Step indicator
  const steps = ['Details', 'Requirements', 'Review & Post']

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
          Post an Assignment
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Describe your task and get matched with qualified executors
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i + 1 <= step ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                i + 1 < step ? 'bg-emerald-500' : i + 1 === step ? 'bg-gradient-to-br from-brand-500 to-violet-500' : 'bg-surface-200 dark:bg-surface-700'
              }`}>
                {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className="text-xs font-display font-medium hidden sm:block" style={{ color: 'var(--text-secondary)' }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 rounded" style={{
                background: i + 1 < step ? 'linear-gradient(90deg, #10b981, #059669)' : 'var(--border-color)',
              }} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Assignment Type */}
        <div className="glass-card p-5">
          <label className="block text-sm font-display font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Assignment Type
          </label>
          <Controller name="type" control={control} render={({ field }) => (
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: 'digital', icon: Monitor, label: 'Digital', desc: 'PDF, DOCX, PPT delivery' },
                { v: 'physical', icon: MapPin, label: 'Physical', desc: 'In-person at your location' },
              ].map(({ v, icon: Icon, label, desc }) => (
                <button key={v} type="button" onClick={() => field.onChange(v)}
                        className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200"
                        style={{
                          borderColor: field.value === v ? 'var(--brand)' : 'var(--border-color)',
                          background: field.value === v ? 'rgba(98,113,244,0.08)' : 'var(--bg-tertiary)',
                        }}>
                  <Icon size={20} style={{ color: field.value === v ? 'var(--brand)' : 'var(--text-muted)' }} />
                  <div>
                    <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )} />
        </div>

        {/* Main Details */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>Assignment Details</h3>

          {/* Title */}
          <div>
            <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Title <span className="text-rose-500">*</span>
            </label>
            <input className="input-field" placeholder="e.g. Data Structures Final Report — Chapter 5"
                   {...register('title', { required: 'Title is required', minLength: { value: 10, message: 'Min 10 characters' } })} />
            {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea rows={5} className="input-field resize-none"
                      placeholder="Describe exactly what you need. Include format, word count, references, specific requirements..."
                      {...register('description', { required: 'Description is required', minLength: { value: 30, message: 'Min 30 characters' } })} />
            {errors.description && <p className="text-rose-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Category <span className="text-rose-500">*</span>
            </label>
            <select className="input-field"
                    {...register('category', { required: 'Category is required' })}>
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category.message}</p>}
          </div>

          {/* Deadline + Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                <Calendar size={13} className="inline mr-1" />
                Deadline <span className="text-rose-500">*</span>
              </label>
              <input type="datetime-local" className="input-field"
                     min={new Date().toISOString().slice(0, 16)}
                     {...register('deadline', { required: 'Deadline is required' })} />
              {errors.deadline && <p className="text-rose-500 text-xs mt-1">{errors.deadline.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                <DollarSign size={13} className="inline mr-1" />
                Budget (PKR) <span className="text-rose-500">*</span>
              </label>
              <input type="number" className="input-field" min={100} step={50}
                     {...register('budget', { required: 'Budget is required', min: { value: 100, message: 'Min 100 PKR' } })} />
              {errors.budget && <p className="text-rose-500 text-xs mt-1">{errors.budget.message}</p>}
            </div>
          </div>

          {/* Platform fee note */}
          {budget > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                 style={{ background: 'rgba(98,113,244,0.08)', border: '1px solid rgba(98,113,244,0.2)' }}>
              <Info size={13} className="mt-0.5 shrink-0 text-brand-400" />
              <p style={{ color: 'var(--text-secondary)' }}>
                Platform fee: <strong>5%</strong> ({Math.round(Number(budget) * 0.05).toLocaleString()} PKR).
                Executor receives: <strong>{Math.round(Number(budget) * 0.95).toLocaleString()} PKR</strong>.
                Payment is held in escrow until you approve.
              </p>
            </div>
          )}
        </div>

        {/* Physical fields */}
        {assignmentType === 'physical' && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-amber-500" />
              <h3 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                Physical Location
              </h3>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Only executors in your city and university will be shown this assignment.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>City</label>
                <input className="input-field" placeholder="Karachi"
                       {...register('city', { required: assignmentType === 'physical' ? 'City is required for physical assignments' : false })} />
              </div>
              <div>
                <label className="block text-sm font-display font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>University</label>
                <input className="input-field" placeholder="FAST NUCES"
                       {...register('university', { required: assignmentType === 'physical' ? 'University is required' : false })} />
              </div>
            </div>
          </div>
        )}

        {/* File Upload */}
        <div className="glass-card p-5">
          <label className="block text-sm font-display font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Attachments <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>(optional, max 5 files)</span>
          </label>

          <div {...getRootProps()}
               className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                 isDragActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : ''
               }`}
               style={{ borderColor: isDragActive ? 'var(--brand)' : 'var(--border-color)', background: isDragActive ? undefined : 'var(--bg-tertiary)' }}>
            <input {...getInputProps()} />
            <Upload size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-display font-medium" style={{ color: 'var(--text-primary)' }}>
              {isDragActive ? 'Drop files here...' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              PDF, DOCX, PPTX, JPG, PNG • Max 20MB each
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                     style={{ background: 'var(--bg-secondary)' }}>
                  <File size={16} className="text-brand-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatFileSize(f.size)}</div>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} style={{ color: 'var(--text-muted)' }}>
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary w-full py-4">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Posting Assignment...
            </span>
          ) : (
            <>Post Assignment <ArrowRight size={16} /></>
          )}
        </button>
      </form>
    </div>
  )
}
