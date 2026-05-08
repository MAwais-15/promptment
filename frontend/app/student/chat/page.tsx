'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Search, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import dynamic from 'next/dynamic'

const ChatPage = dynamic(() => import('@/components/chat/ChatPage'), { ssr: false })

const MOCK_CONVERSATIONS = [
  {
    _id: 'c1', assignmentId: 'a1',
    assignmentTitle: 'Machine Learning Classification Model',
    other: { name: 'Bilal R.', role: 'executor', online: true },
    lastMessage: { content: 'I have started working on the CNN architecture...', sentAt: new Date(Date.now() - 15*60000).toISOString() },
    unread: 2,
  },
  {
    _id: 'c2', assignmentId: 'a3',
    assignmentTitle: 'Data Structures Lab — AVL Trees',
    other: { name: 'Zara A.', role: 'executor', online: false },
    lastMessage: { content: 'The report has been submitted. Please review it.', sentAt: new Date(Date.now() - 2*3600000).toISOString() },
    unread: 1,
  },
  {
    _id: 'c3', assignmentId: 'a5',
    assignmentTitle: 'Circuit Design Lab — Op-Amp Configurations',
    other: { name: 'Nida Q.', role: 'executor', online: true },
    lastMessage: { content: 'Can we meet tomorrow at the lab?', sentAt: new Date(Date.now() - 5*3600000).toISOString() },
    unread: 0,
  },
]

export default function StudentChatPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch]     = useState('')

  const filtered = MOCK_CONVERSATIONS.filter(c =>
    !search ||
    c.assignmentTitle.toLowerCase().includes(search.toLowerCase()) ||
    c.other.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedConv = MOCK_CONVERSATIONS.find(c => c._id === selected)

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      {/* Sidebar */}
      <div className={`w-full sm:w-80 flex-col border-r ${selected ? 'hidden sm:flex' : 'flex'}`}
           style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-display font-semibold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
            Messages
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search conversations..."
                   value={search} onChange={e => setSearch(e.target.value)}
                   className="input-field pl-9 py-2 text-sm" />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
            </div>
          ) : (
            filtered.map(conv => (
              <button key={conv._id} onClick={() => setSelected(conv._id)}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b ${
                        selected === conv._id ? 'bg-brand-500/10' : ''
                      }`}
                      style={{ borderColor: 'var(--border-color)' }}>
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                       style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                    {conv.other.name.charAt(0)}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${conv.other.online ? 'bg-emerald-400' : 'bg-surface-400'}`}
                        style={{ borderColor: 'var(--bg-secondary)' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {conv.other.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ background: 'var(--brand)' }}>
                          {conv.unread}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {formatDistanceToNow(new Date(conv.lastMessage.sentAt), { addSuffix: false })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs truncate mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    {conv.lastMessage.content}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                    {conv.assignmentTitle}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selected ? 'hidden sm:flex' : 'flex'}`}>
        {selected ? (
          <ChatPage />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
            <MessageSquare size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Select a conversation
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
