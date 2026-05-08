'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Send, Paperclip, Check, CheckCheck, X, File, Download } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'
import { io, Socket } from 'socket.io-client'
import { chatAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Message {
  _id: string
  content: string
  sender: { _id: string; name: string; role: string }
  attachments?: { name: string; url: string; size: number }[]
  createdAt: string
  read: boolean
}

// â”€â”€â”€ Date Label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function dateLabel(date: Date): string {
  if (isToday(date))     return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

// â”€â”€â”€ Message Bubble â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1"
             style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
          {msg.sender.name.charAt(0)}
        </div>
      )}

      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs mb-1 px-1 font-display font-medium" style={{ color: 'var(--text-muted)' }}>
            {msg.sender.name}
          </span>
        )}

        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? 'rounded-br-md text-white'
            : 'rounded-bl-md'
        }`}
        style={isOwn
          ? { background: 'linear-gradient(135deg, #6271f4, #a855f7)', boxShadow: '0 4px 16px rgba(98,113,244,0.35)' }
          : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }
        }>
          {msg.content && <p>{msg.content}</p>}

          {/* Attachments */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className={`mt-2 space-y-1.5 ${msg.content ? 'border-t pt-2' : ''}`}
                 style={{ borderColor: isOwn ? 'rgba(255,255,255,0.2)' : 'var(--border-color)' }}>
              {msg.attachments.map((att, i) => (
                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs transition-colors"
                   style={{ background: isOwn ? 'rgba(255,255,255,0.15)' : 'var(--bg-secondary)' }}>
                  <File size={13} />
                  <span className="flex-1 truncate font-medium">{att.name}</span>
                  <Download size={12} className="shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp + Read status */}
        <div className={`flex items-center gap-1 mt-1 px-1 text-[10px]`} style={{ color: 'var(--text-muted)' }}>
          <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
          {isOwn && (msg.read ? <CheckCheck size={11} className="text-brand-400" /> : <Check size={11} />)}
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Chat Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ChatPage() {
  const params = useParams()
  const conversationId = params?.id as string
  const { user } = useAuthStore()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading]    = useState(true)

  const socketRef  = useRef<Socket | null>(null)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<NodeJS.Timeout | null>(null)

  // â”€â”€ Scroll to bottom â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // â”€â”€ Load history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!conversationId) return
    async function load() {
      try {
        const res = await chatAPI.getMessages(conversationId)
        setMessages(res.data.messages || [])
        chatAPI.markRead(conversationId).catch(() => {})
      } catch {
        // use mock messages in dev
        setMessages([
          {
            _id: 'm1',
            content: 'Hi! I saw your assignment posting and I am very interested. I have experience in ML and data analysis.',
            sender: { _id: 'ex1', name: 'Bilal R.', role: 'executor' },
            createdAt: new Date(Date.now() - 30*60000).toISOString(),
            read: true,
          },
          {
            _id: 'm2',
            content: 'That is great! Can you handle TensorFlow and scikit-learn? The project involves building a classification model.',
            sender: { _id: user?._id || 'st1', name: user?.name || 'You', role: 'student' },
            createdAt: new Date(Date.now() - 25*60000).toISOString(),
            read: true,
          },
          {
            _id: 'm3',
            content: 'Absolutely, I have worked with both extensively. I can deliver a well-documented Jupyter notebook with model evaluation and visualizations.',
            sender: { _id: 'ex1', name: 'Bilal R.', role: 'executor' },
            createdAt: new Date(Date.now() - 20*60000).toISOString(),
            read: true,
          },
          {
            _id: 'm4',
            content: 'Perfect. The deadline is in 3 days. Can you commit to that timeline?',
            sender: { _id: user?._id || 'st1', name: user?.name || 'You', role: 'student' },
            createdAt: new Date(Date.now() - 15*60000).toISOString(),
            read: false,
          },
        ])
      } finally {
        setLoading(false)
        setTimeout(scrollToBottom, 100)
      }
    }
    load()
  }, [conversationId, user?._id, scrollToBottom])

  // â”€â”€ Socket.io â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'
    const token = Cookies.get('promptment_token')

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      if (conversationId) socket.emit('join_conversation', conversationId)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg])
      setTimeout(scrollToBottom, 50)
      chatAPI.markRead(conversationId).catch(() => {})
    })

    socket.on('user_typing', (data: { userId: string; typing: boolean }) => {
      if (data.userId !== user?._id) setOtherTyping(data.typing)
    })

    socket.on('message_read', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, read: true } : m))
    })

    return () => { socket.disconnect() }
  }, [conversationId, user?._id, scrollToBottom])

  // â”€â”€ Typing indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleTyping = (val: string) => {
    setInput(val)
    if (!isTyping) {
      setIsTyping(true)
      socketRef.current?.emit('typing', { conversationId, typing: true })
    }
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      setIsTyping(false)
      socketRef.current?.emit('typing', { conversationId, typing: false })
    }, 1500)
  }

  // â”€â”€ Send message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sendMessage = async () => {
    const content = input.trim()
    if (!content && attachments.length === 0) return

    const optimistic: Message = {
      _id: `tmp-${Date.now()}`,
      content,
      sender: { _id: user?._id || '', name: user?.name || '', role: user?.role || '' },
      createdAt: new Date().toISOString(),
      read: false,
    }

    setMessages(prev => [...prev, optimistic])
    setInput('')
    setAttachments([])
    setTimeout(scrollToBottom, 50)

    try {
      const attUrls: string[] = []
      await chatAPI.sendMessage(conversationId, content, attUrls)
    } catch {
      toast.error('Failed to send message')
      setMessages(prev => prev.filter(m => m._id !== optimistic._id))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // â”€â”€ Group messages by date â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const grouped: { label: string; msgs: Message[] }[] = []
  messages.forEach(msg => {
    const label = dateLabel(new Date(msg.createdAt))
    const last = grouped[grouped.length - 1]
    if (last && last.label === label) last.msgs.push(msg)
    else grouped.push({ label, msgs: [msg] })
  })

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
           style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                 style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
              B
            </div>
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${connected ? 'bg-emerald-400' : 'bg-surface-400'}`}
                  style={{ borderColor: 'var(--bg-secondary)' }} />
          </div>
          <div>
            <div className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Bilal R.
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {connected ? 'Online' : 'Offline'} Â· Executor
            </div>
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-full font-display font-medium"
             style={{ background: 'rgba(98,113,244,0.1)', color: 'var(--brand)' }}>
          ML Assignment
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="skeleton h-12 rounded-2xl" style={{ width: `${Math.random() * 30 + 30}%` }} />
              </div>
            ))}
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label}>
              {/* Date divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                  {group.label}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              </div>

              <div className="space-y-3">
                {group.msgs.map(msg => (
                  <MessageBubble
                    key={msg._id}
                    msg={msg}
                    isOwn={msg.sender._id === user?._id || msg.sender.name === user?.name}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {otherTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                 style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>B</div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1"
                 style={{ background: 'var(--bg-tertiary)' }}>
              {[0, 0.2, 0.4].map(d => (
                <span key={d} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: 'var(--text-muted)', animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t flex gap-2 overflow-x-auto"
             style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
          {attachments.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs shrink-0"
                 style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              <File size={12} />
              <span className="max-w-[100px] truncate">{f.name}</span>
              <button onClick={() => setAttachments(p => p.filter((_, idx) => idx !== i))}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="px-4 py-3 border-t shrink-0"
           style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-end gap-3 p-2 rounded-2xl border"
             style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
          {/* Attach */}
          <button onClick={() => fileRef.current?.click()}
                  className="p-2 rounded-xl transition-colors shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Attach file">
            <Paperclip size={18} />
          </button>
          <input ref={fileRef} type="file" multiple className="hidden"
                 onChange={e => setAttachments(p => [...p, ...Array.from(e.target.files || [])])} />

          {/* Text */}
          <textarea
            value={input}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a messageâ€¦ (Enter to send)"
            className="flex-1 bg-transparent resize-none outline-none text-sm py-1.5"
            style={{
              color: 'var(--text-primary)',
              maxHeight: '120px',
            }}
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() && attachments.length === 0}
            className="p-2.5 rounded-xl text-white transition-all duration-200 shrink-0 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #6271f4, #a855f7)' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}




