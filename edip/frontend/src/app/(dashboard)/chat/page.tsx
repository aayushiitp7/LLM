'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Bot,
  User,
  FileText,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  MessageSquare,
  Plus,
  Settings,
  Search,
  X,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────

interface Citation {
  chunk_id: string
  document_id: string
  document_title: string
  filename: string
  page_number?: number
  section?: string
  relevance_score: number
  content_snippet: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  confidence_score?: number
  answer_refused?: boolean
  refusal_reason?: string
  tokens_used?: number
  latency_ms?: number
  timestamp: Date
  streaming?: boolean
}

// ─── Citation Tooltip ─────────────────────────────────────────────────────

function CitationTooltip({
  citation,
  index,
}: {
  citation: Citation
  index: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        className="citation-badge mx-0.5"
        onClick={() => setOpen(!open)}
        title={`${citation.document_title} — Page ${citation.page_number ?? 'N/A'}`}
      >
        {index}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-80 glass-card rounded-xl p-4 z-50 text-xs"
            style={{ border: '1px solid rgba(59, 95, 255, 0.2)' }}
          >
            <div className="flex items-start gap-2 mb-2">
              <FileText className="w-3.5 h-3.5 text-brand-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-foreground">{citation.document_title}</div>
                <div className="text-muted-foreground">{citation.filename}</div>
              </div>
            </div>

            {citation.page_number && (
              <div className="text-muted-foreground mb-2">Page {citation.page_number}</div>
            )}
            {citation.section && (
              <div className="text-muted-foreground mb-2">{citation.section}</div>
            )}

            <div className="border-t border-white/5 pt-2 mt-2">
              <div className="text-muted-foreground line-clamp-3">{citation.content_snippet}</div>
            </div>

            <div className="flex items-center gap-1 mt-2">
              <div className="text-muted-foreground">Relevance:</div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-1.5 rounded-sm"
                    style={{
                      background: i < Math.round(citation.relevance_score * 5)
                        ? '#3b5fff'
                        : 'rgba(255,255,255,0.1)',
                    }}
                  />
                ))}
              </div>
              <div className="text-brand-400 font-mono">
                {(citation.relevance_score * 100).toFixed(0)}%
              </div>
            </div>

            <button
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Message Content Renderer ─────────────────────────────────────────────

function MessageContent({
  content,
  citations,
}: {
  content: string
  citations?: Citation[]
}) {
  if (!citations?.length) {
    return <div className="prose prose-sm prose-invert max-w-none leading-relaxed">{content}</div>
  }

  // Replace [1], [2] etc with interactive citation badges
  const parts = content.split(/(\[\d+\])/g)

  return (
    <div className="leading-relaxed">
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/)
        if (match) {
          const num = parseInt(match[1])
          const citation = citations[num - 1]
          if (citation) {
            return <CitationTooltip key={i} citation={citation} index={num} />
          }
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}

// ─── Chat Message ─────────────────────────────────────────────────────────

function ChatMessage({
  message,
  onFeedback,
}: {
  message: Message
  onFeedback?: (id: string, feedback: 'thumbs_up' | 'thumbs_down') => void
}) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'thumbs_up' | 'thumbs_down' | null>(null)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: 'thumbs_up' | 'thumbs_down') => {
    setFeedback(type)
    onFeedback?.(message.id, type)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
          isUser
            ? 'bg-brand-600'
            : 'bg-gradient-to-br from-purple-600 to-brand-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={isUser ? 'chat-user text-sm' : 'chat-assistant text-sm'}>
          {message.streaming && !message.content ? (
            <div className="flex gap-1 py-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-brand-400"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          ) : (
            <MessageContent content={message.content} citations={message.citations} />
          )}
        </div>

        {/* Citations panel */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full"
          >
            <div className="text-[10px] text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              {message.citations.length} Sources
            </div>
            <div className="flex flex-wrap gap-2">
              {message.citations.slice(0, 5).map((citation, i) => (
                <div
                  key={citation.chunk_id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]"
                  style={{
                    background: 'rgba(59, 95, 255, 0.08)',
                    border: '1px solid rgba(59, 95, 255, 0.15)',
                  }}
                >
                  <span className="text-brand-400 font-bold">[{i + 1}]</span>
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground truncate max-w-[120px]">
                    {citation.filename}
                  </span>
                  {citation.page_number && (
                    <span className="text-muted-foreground">p.{citation.page_number}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Confidence + Metadata bar */}
        {!isUser && message.confidence_score !== undefined && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
            {/* Confidence */}
            <div className="flex items-center gap-1">
              {message.confidence_score > 0.7 ? (
                <CheckCircle2 className="w-3 h-3 text-success" />
              ) : message.confidence_score > 0.4 ? (
                <AlertTriangle className="w-3 h-3 text-warning" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-destructive" />
              )}
              <span>Confidence: </span>
              <span
                className={
                  message.confidence_score > 0.7
                    ? 'text-success font-semibold'
                    : message.confidence_score > 0.4
                    ? 'text-warning font-semibold'
                    : 'text-destructive font-semibold'
                }
              >
                {(message.confidence_score * 100).toFixed(0)}%
              </span>
            </div>

            {/* Latency */}
            {message.latency_ms && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{message.latency_ms}ms</span>
              </div>
            )}

            {/* Tokens */}
            {message.tokens_used && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{message.tokens_used} tokens</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-white/5 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <CheckCircle2 className="w-3 h-3 text-success" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>

              <button
                onClick={() => handleFeedback('thumbs_up')}
                className={`p-1 rounded hover:bg-white/5 transition-colors ${
                  feedback === 'thumbs_up' ? 'text-success' : ''
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
              </button>

              <button
                onClick={() => handleFeedback('thumbs_down')}
                className={`p-1 rounded hover:bg-white/5 transition-colors ${
                  feedback === 'thumbs_down' ? 'text-destructive' : ''
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Suggested Queries ────────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  'What are the key obligations and liabilities in this contract?',
  'Summarize the compliance requirements across all uploaded policies.',
  'Find clauses that deviate from standard industry templates.',
  'What are the payment terms and penalty clauses?',
  'Identify all parties mentioned and their roles.',
  'What are the termination conditions in this agreement?',
]

// ─── Main Chat Interface ──────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your enterprise document intelligence assistant. I can analyze your uploaded documents, answer questions with source citations, compare clauses, and identify compliance risks.\n\nWhat would you like to explore today?",
      citations: [],
      confidence_score: 1.0,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    }

    const assistantMsgId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      streaming: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsLoading(true)
    setShowSuggestions(false)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            query: query.trim(),
            session_id: sessionId,
            document_ids: selectedDocs.length > 0 ? selectedDocs : null,
            stream: true,
            top_k: 5,
          }),
        }
      )

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let finalMeta: Partial<Message> = {}

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'token') {
              fullContent += data.content
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: fullContent, streaming: true }
                    : m
                )
              )
            } else if (data.type === 'done') {
              finalMeta = {
                citations: data.citations || [],
                confidence_score: data.confidence_score,
                answer_refused: data.answer_refused,
                tokens_used: data.tokens_used,
                latency_ms: data.total_latency_ms,
              }
            } else if (data.type === 'error') {
              fullContent = 'An error occurred while generating the response. Please try again.'
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      // Finalize message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: fullContent, streaming: false, ...finalMeta }
            : m
        )
      )
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: 'Failed to connect to the AI service. Please check your connection and try again.',
                streaming: false,
                confidence_score: 0,
              }
            : m
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, sessionId, selectedDocs])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleFeedback = useCallback(
    async (queryId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/${sessionId}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ query_id: queryId, feedback }),
        })
      } catch {
        // Non-critical
      }
    },
    [sessionId]
  )

  return (
    <div className="flex flex-col h-full bg-surface-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b5fff)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">AI Document Chat</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="status-online" />
              <span>GPT-4o · Hybrid RAG · Source Citations Enabled</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all hover:bg-white/5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Session
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onFeedback={handleFeedback}
          />
        ))}

        {/* Suggested queries (shown when no messages) */}
        <AnimatePresence>
          {showSuggestions && messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pt-4"
            >
              <div className="text-xs text-muted-foreground mb-3 font-medium flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                Suggested Queries
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUERIES.map((query) => (
                  <button
                    key={query}
                    onClick={() => sendMessage(query)}
                    className="text-left px-4 py-3 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-all duration-200 group"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(59, 95, 255, 0.2)'
                      e.currentTarget.style.background = 'rgba(59, 95, 255, 0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <span className="group-hover:text-brand-400 transition-colors mr-1">→</span>
                    {query}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="px-6 py-4 border-t border-white/[0.04]"
        style={{ background: 'rgba(15, 17, 32, 0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl p-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents... (Shift+Enter for newline)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none leading-relaxed"
            rows={1}
            style={{ maxHeight: '120px', minHeight: '20px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
            }}
            disabled={isLoading}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40"
            style={{
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #3b5fff, #8b5cf6)'
                : 'rgba(255,255,255,0.05)',
            }}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-muted-foreground">
          <span>Responses grounded in your documents. Citations included.</span>
          <span>Enter to send · Shift+Enter for newline</span>
        </div>
      </div>
    </div>
  )
}
