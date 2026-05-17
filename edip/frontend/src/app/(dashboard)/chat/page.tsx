'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, User, FileText, X, ExternalLink, ShieldCheck,
  Brain, ChevronDown, ChevronUp, Sparkles, AlertCircle, MessageSquare
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Source {
  id: string
  title: string
  confidence: number
  snippet: string
  page?: number
}

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  isLoading?: boolean
}

// ── Seed conversation ─────────────────────────────────────────────────────────
const INITIAL_MESSAGES: Message[] = [
  {
    id: 1, role: 'user',
    content: 'Which contracts have termination notice periods less than 30 days?',
  },
  {
    id: 2, role: 'assistant',
    content: `Based on my analysis of the contract corpus, **3 contracts** have termination notice periods below 30 days:\n\n1. **Acme Corp MSA (2023)** — 14-day notice clause (§12.3)\n2. **Vendor Agreement — DataSync Ltd** — 7-day notice for T&M engagements\n3. **SubProcessor DPA — CloudHost Inc** — 21-day notice on data processing termination\n\nThis represents a **compliance risk** under your standard contract policy which mandates minimum 30-day notice. I recommend escalating items 1 and 2 for renegotiation.`,
    sources: [
      { id: 's1', title: 'Acme_Corp_MSA_2023.pdf', confidence: 0.97, snippet: '§12.3 Either party may terminate this Agreement upon 14 days written notice to the other party without cause.', page: 8 },
      { id: 's2', title: 'DataSync_Vendor_Agreement_v2.pdf', confidence: 0.94, snippet: 'For time-and-materials engagements, either party may terminate with 7 calendar days written notice.', page: 3 },
      { id: 's3', title: 'CloudHost_DPA_SubProcessor.pdf', confidence: 0.89, snippet: 'Termination of data processing activities shall be notified 21 days in advance per GDPR Article 28.', page: 12 },
    ]
  }
]

const SUGGESTED_QUERIES = [
  'Summarize all invoices exceeding $100k in Q3',
  'Which employees have non-compete clauses expiring in 2026?',
  'Find all contracts with auto-renewal provisions',
  'What are the key risks in the Acme Corp agreement?',
]

// ── Source Card ───────────────────────────────────────────────────────────────
function SourceCard({ source, onClick, isActive }: { source: Source; onClick: () => void; isActive: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-all border ${
        isActive
          ? 'bg-foreground text-background border-foreground'
          : 'bg-secondary text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
      }`}
    >
      <FileText className="w-3 h-3 shrink-0" />
      <span className="truncate max-w-[140px]">{source.title.replace('.pdf','').replace('.docx','').substring(0,20)}…</span>
      <span className={`font-mono-number text-[10px] font-bold ${isActive ? 'text-background/70' : 'text-muted-foreground'}`}>
        {(source.confidence * 100).toFixed(0)}%
      </span>
    </button>
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, onSourceClick, activeSourceId }: {
  msg: Message
  onSourceClick: (s: Source) => void
  activeSourceId: string | null
}) {
  const [expanded, setExpanded] = useState(false)

  // Format markdown-like content
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>
        }
        // Bold inline
        const parts = line.split(/(\*\*[^*]+\*\*)/g)
        return (
          <p key={i} className={line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') ? 'ml-3' : ''}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        )
      })
  }

  if (msg.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex justify-end gap-3"
      >
        <div className="max-w-[75%] bg-primary text-primary-foreground rounded-xl rounded-tr-md px-4 py-3 text-sm leading-relaxed">
          {msg.content}
        </div>
        <div className="w-7 h-7 rounded-full border border-border bg-secondary flex items-center justify-center shrink-0 mt-1">
          <User className="w-3.5 h-3.5 text-foreground" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex gap-3"
    >
      <div className="w-7 h-7 rounded-full border border-border bg-secondary flex items-center justify-center shrink-0 mt-1">
        <Brain className="w-3.5 h-3.5 text-foreground" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="premium-card px-4 py-4">
          {msg.isLoading ? (
            <TypingIndicator />
          ) : (
            <div className="text-sm text-foreground leading-relaxed space-y-1.5">
              {formatContent(msg.content)}
            </div>
          )}

          {/* Sources */}
          {msg.sources && msg.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} retrieved
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {msg.sources.map(source => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    isActive={activeSourceId === source.id}
                    onClick={() => onSourceClick(source)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeSource, setActiveSource] = useState<Source | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text?: string) => {
    const q = (text || input).trim()
    if (!q || isLoading) return
    setInput('')

    const userMsg: Message = { id: Date.now(), role: 'user', content: q }
    const loadingMsg: Message = { id: Date.now() + 1, role: 'assistant', content: '', isLoading: true }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setIsLoading(true)

    setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.isLoading ? {
          ...m,
          isLoading: false,
          content: 'I am operating in demo mode. Connect the FastAPI backend to process live document queries. The RAG pipeline is ready — configure your OPENAI_API_KEY and MONGODB_URL to enable real-time intelligence.',
          sources: []
        } : m
      ))
      setIsLoading(false)
    }, 1200)
  }

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* ── Chat Panel ──────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${activeSource ? 'mr-80' : ''}`}>

        {/* Sub-header */}
        <div className="h-12 border-b border-border bg-popover flex items-center px-6 gap-3 shrink-0">
          <div className="w-5 h-5 rounded bg-secondary border border-border flex items-center justify-center">
            <MessageSquare className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold">Document Intelligence Chat</span>
          <span className="text-border">·</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            RAG Mode Active
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground border border-amber-400/20 bg-amber-400/5 rounded px-2 py-0.5">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Demo Mode — Connect backend for live queries
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-none">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Context banner */}
            <div className="premium-card px-4 py-3 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">Context: Legal Contracts Workspace</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Querying 4,218 indexed documents · BM25 + semantic hybrid retrieval · Cross-encoder reranking
                </p>
              </div>
            </div>

            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onSourceClick={(s) => setActiveSource(prev => prev?.id === s.id ? null : s)}
                activeSourceId={activeSource?.id ?? null}
              />
            ))}
          </div>
        </div>

        {/* Suggested queries */}
        {messages.length <= 2 && (
          <div className="px-6 pb-3 flex gap-2 flex-wrap max-w-3xl mx-auto w-full">
            {SUGGESTED_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-secondary hover:text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border bg-popover p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about your enterprise documents..."
                disabled={isLoading}
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-primary px-4 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              All answers are grounded in retrieved sources — verify critical decisions with original documents.
            </p>
          </div>
        </div>
      </div>

      {/* ── Evidence Inspector ───────────────────────────────────────── */}
      <AnimatePresence>
        {activeSource && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="absolute right-0 top-0 bottom-0 w-80 border-l border-border bg-popover z-30 flex flex-col shadow-xl"
          >
            {/* Panel header */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Evidence Inspector
              </div>
              <button
                onClick={() => setActiveSource(null)}
                className="btn-icon w-7 h-7"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Source doc */}
              <div>
                <p className="section-label mb-2">Source Document</p>
                <div className="premium-card p-3 flex items-start gap-2.5 cursor-pointer hover:bg-secondary transition-colors group">
                  <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground break-all leading-snug">{activeSource.title}</p>
                    {activeSource.page && (
                      <p className="text-[10px] text-muted-foreground mt-1">Page {activeSource.page}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 group-hover:text-foreground transition-colors">
                      Open original <ExternalLink className="w-2.5 h-2.5" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence */}
              <div>
                <p className="section-label mb-2">Retrieval Score</p>
                <div className="premium-card p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Cosine similarity</span>
                    <span className="font-mono-number font-bold text-emerald-400">{(activeSource.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${activeSource.confidence * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {activeSource.confidence > 0.9 ? 'High confidence — strongly relevant' :
                     activeSource.confidence > 0.8 ? 'Good confidence — likely relevant' : 'Moderate confidence — review manually'}
                  </p>
                </div>
              </div>

              {/* Extracted chunk */}
              <div>
                <p className="section-label mb-2">Retrieved Chunk</p>
                <div className="premium-card p-3">
                  <p className="text-xs text-foreground leading-relaxed italic">
                    "{activeSource.snippet}"
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button className="btn-secondary w-full justify-center text-xs">
                  Open in Document Viewer
                </button>
                <button className="btn-ghost w-full justify-center text-xs text-muted-foreground">
                  Flag for Review
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
