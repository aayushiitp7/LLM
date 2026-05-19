'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, User, FileText, X, ExternalLink, ShieldCheck,
  Brain, Sparkles, MessageSquare, AlertCircle, Loader2, Wifi, WifiOff
} from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

// ── Types ─────────────────────────────────────────────────────────────────────
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
  isError?: boolean
}

const SEEDS: Message[] = []

const SUGGESTED = [
  'Summarize all invoices from the last quarter',
  'Find all contracts with auto-renewal provisions',
  'What are the key risks in our MSA templates?',
]

// ── Markdown formatter ────────────────────────────────────────────────────────
function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((p, j) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={j} className="text-foreground font-semibold">{p.slice(2,-2)}</strong>
        : <React.Fragment key={j}>{p}</React.Fragment>
    )
    return <p key={i} className={`${i > 0 ? 'mt-1.5' : ''} ${/^\d+\./.test(line) ? 'ml-3' : ''}`}>{rendered}</p>
  })
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function Typing() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0,1,2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i*0.2 }} />
      ))}
    </div>
  )
}

// ── Source chip ───────────────────────────────────────────────────────────────
function SourceChip({ source, active, onClick }: { source: Source; active: boolean; onClick: ()=>void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-semibold border transition-all ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground'
      }`}>
      <FileText className="w-3 h-3 shrink-0" />
      {source.title.substring(0, 22)}…
      <span className={`font-mono-number ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
        {(source.confidence * 100).toFixed(0)}%
      </span>
    </button>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, onSource, activeId }: { msg: Message; onSource: (s:Source)=>void; activeId: string|null }) {
  if (msg.role === 'user') return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.15 }}
      className="flex justify-end gap-2.5">
      <div className="max-w-[78%] bg-primary text-primary-foreground rounded-xl rounded-tr-md px-4 py-3 text-sm leading-relaxed">
        {msg.content}
      </div>
      <div className="w-7 h-7 rounded-full border border-border bg-secondary flex items-center justify-center shrink-0 mt-1">
        <User className="w-3.5 h-3.5" />
      </div>
    </motion.div>
  )

  return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.15 }}
      className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full border border-border bg-secondary flex items-center justify-center shrink-0 mt-1">
        <Brain className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className={`premium-card px-4 py-4 ${msg.isError ? 'border-red-500/20 bg-red-500/5' : ''}`}>
          {msg.isLoading ? <Typing /> : (
            <div className="text-sm leading-relaxed space-y-0.5 text-foreground">
              {msg.isError
                ? <p className="text-red-400 text-xs">{msg.content}</p>
                : renderContent(msg.content)
              }
            </div>
          )}
          {msg.sources && msg.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="section-label">{msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''} retrieved</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {msg.sources.map(s => (
                  <SourceChip key={s.id} source={s} active={activeId===s.id} onClick={() => onSource(s)} />
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
  const [messages, setMessages] = useState<Message[]>(SEEDS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeSource, setActiveSource] = useState<Source|null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking'|'online'|'offline'>('checking')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Check backend health
  useEffect(() => {
    fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) })
      .then(r => setBackendStatus(r.ok ? 'online' : 'offline'))
      .catch(() => setBackendStatus('offline'))
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const send = async (q?: string) => {
    const text = (q || input).trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = { id: Date.now(), role: 'user', content: text }
    const loadMsg: Message = { id: Date.now()+1, role: 'assistant', content: '', isLoading: true }
    setMessages(p => [...p, userMsg, loadMsg])
    setLoading(true)

    try {
      // Real API call
      const res = await fetch(`${API_BASE}/api/v1/chat/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local' },
        body: JSON.stringify({ query: text, collection: 'enterprise_docs', top_k: 5 }),
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) {
         throw new Error(`API Error: ${res.statusText}`)
      }
      const data = await res.json()
      setMessages(p => p.map(m => m.isLoading ? {
        ...m, isLoading: false,
        content: data.answer || data.response || data.content || 'No response from model.',
        sources: (data.sources || data.citations || []).map((s: any, i: number) => ({
          id: String(i), title: s.title || s.filename || s.source || 'Document',
          confidence: s.score || s.confidence || 0.85,
          snippet: s.content || s.text || s.snippet || '',
          page: s.page,
        }))
      } : m))
    } catch (e: any) {
      setMessages(p => p.map(m => m.isLoading ? { 
        ...m, isLoading: false, isError: true, 
        content: `Connection failed: ${e.message}. Ensure backend is running.` 
      } : m))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${activeSource ? 'mr-80' : ''}`}>

        {/* Sub-header */}
        <div className="h-12 border-b border-border bg-popover flex items-center px-6 gap-3 shrink-0">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Document Intelligence Chat</span>
          <span className="text-border">·</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            RAG Pipeline
          </span>
          <div className="ml-auto flex items-center gap-2">
            {backendStatus === 'online' ? (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                <Wifi className="w-3 h-3" /> Backend Connected
              </span>
            ) : backendStatus === 'offline' ? (
              <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold">
                <WifiOff className="w-3 h-3" /> Local Mode
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Connecting…
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-none">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Context banner */}
            <div className="premium-card px-4 py-3 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">Context: Enterprise Document Corpus</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  124,592 documents indexed · BM25 + semantic hybrid retrieval · Cross-encoder reranking
                </p>
              </div>
            </div>

            {messages.map(msg => (
              <Bubble key={msg.id} msg={msg}
                onSource={s => setActiveSource(p => p?.id === s.id ? null : s)}
                activeId={activeSource?.id ?? null} />
            ))}
          </div>
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-6 pb-3">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
              {SUGGESTED.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-secondary hover:text-foreground transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border bg-popover p-4 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about your enterprise documents..."
                disabled={loading}
                className="input-field flex-1" />
              <button type="submit" disabled={!input.trim() || loading}
                className="btn-primary px-4 disabled:opacity-40">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              All answers are grounded in retrieved source chunks — verify critical decisions with original documents.
            </p>
          </div>
        </div>
      </div>

      {/* Evidence Inspector */}
      <AnimatePresence>
        {activeSource && (
          <motion.div initial={{ x:'100%', opacity:0 }} animate={{ x:0, opacity:1 }} exit={{ x:'100%', opacity:0 }}
            transition={{ type:'tween', duration:0.2 }}
            className="absolute right-0 top-0 bottom-0 w-80 border-l border-border bg-popover z-30 flex flex-col shadow-xl">
            <div className="h-12 flex items-center justify-between px-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Evidence Inspector
              </div>
              <button onClick={() => setActiveSource(null)} className="btn-icon w-7 h-7">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <p className="section-label mb-2">Source Document</p>
                <div className="premium-card p-3 flex items-start gap-2.5 hover:bg-secondary transition-colors cursor-pointer group">
                  <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold break-all leading-snug">{activeSource.title}</p>
                    {activeSource.page && <p className="text-[10px] text-muted-foreground mt-1">Page {activeSource.page}</p>}
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 group-hover:text-foreground transition-colors">
                      Open original <ExternalLink className="w-2.5 h-2.5" />
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="section-label mb-2">Retrieval Score</p>
                <div className="premium-card p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Cosine similarity</span>
                    <span className="font-mono-number font-bold text-emerald-400">{(activeSource.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activeSource.confidence*100}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <p className="section-label mb-2">Retrieved Chunk</p>
                <div className="premium-card p-3">
                  <p className="text-xs text-foreground leading-relaxed italic">"{activeSource.snippet}"</p>
                </div>
              </div>
              <div className="space-y-2">
                <button className="btn-secondary w-full justify-center text-xs">Open in Document Viewer</button>
                <button className="btn-ghost w-full justify-center text-xs text-muted-foreground">Flag for Review</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
