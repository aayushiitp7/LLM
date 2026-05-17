'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, FileText, ChevronRight, X, ExternalLink, ShieldCheck } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// --- Mock Data ---
const MOCK_CHAT = [
  { 
    id: 1, 
    role: 'user', 
    content: 'What were our revenue projections for Q3 based on the latest financial models?' 
  },
  { 
    id: 2, 
    role: 'assistant', 
    content: 'Based on the latest financial models, our Q3 revenue projections indicate a **14.5% year-over-year increase**, reaching approximately $45.2M. \n\nThis growth is primarily driven by the expansion of our enterprise SaaS segment and increased renewals in the EMEA region [[1]](#). However, the operational costs are also projected to rise by 4.2% due to data center expansions [[2]](#).\n\nWould you like a breakdown of the specific product lines driving this revenue?',
    sources: [
      { id: '1', title: 'Q3_Financial_Projections_v4.xlsx', confidence: 0.94, snippet: 'EMEA region shows strong renewal rates at 92%, contributing to the 14.5% YoY growth projection ($45.2M total).' },
      { id: '2', title: 'Data_Center_Expansion_Budget.pdf', confidence: 0.88, snippet: 'Total operational costs (OpEx) for Q3 will increase by an estimated 4.2% to cover the new Frankfurt data center rollout.' }
    ]
  }
]

export default function ChatPage() {
  const [messages, setMessages] = useState(MOCK_CHAT)
  const [input, setInput] = useState('')
  const [activeSource, setActiveSource] = useState<any | null>(null)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    const newMsg = { id: Date.now(), role: 'user', content: input }
    setMessages([...messages, newMsg])
    setInput('')
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I am currently operating in a simulated environment. To answer this query with real data, please connect me to the live ingestion pipeline.',
        sources: []
      }])
    }, 1000)
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${activeSource ? 'mr-80' : ''}`}>
        
        {/* Header */}
        <header className="h-16 flex items-center px-6 border-b border-white/5 bg-surface-300/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">Financial Analyst Intelligence</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-success" />
                Enterprise RAG Pipeline Active
              </p>
            </div>
          </div>
        </header>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0 shadow-glow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[85%] rounded-2xl p-5 ${
                  msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-tr-sm shadow-card' 
                    : 'bg-surface-200 border border-white/5 text-foreground rounded-tl-sm shadow-card'
                }`}>
                  <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-a:text-brand-400">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Inline Sources/Citations Container */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                      {msg.sources.map((source: any, idx: number) => (
                        <button 
                          key={source.id}
                          onClick={() => setActiveSource(source)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-100 border border-white/5 text-xs text-muted-foreground hover:bg-surface-300 hover:text-foreground transition-colors"
                        >
                          <FileText className="w-3 h-3 text-brand-400" />
                          <span>[{idx + 1}] {source.title.substring(0, 20)}...</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-surface-100 border border-white/5 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-surface-300/80 backdrop-blur-md border-t border-white/5">
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your enterprise documents..." 
                className="w-full bg-surface-200 border border-white/10 rounded-xl pl-4 pr-14 py-4 text-sm text-foreground focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-inner-glow transition-all"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-muted-foreground">AI can make mistakes. Always verify critical enterprise data against source documents.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Inspector Side Panel */}
      <AnimatePresence>
        {activeSource && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 border-l border-white/5 bg-surface-200 absolute right-0 top-0 bottom-0 z-20 shadow-2xl flex flex-col"
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-surface-300">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Source Inspector
              </h2>
              <button 
                onClick={() => setActiveSource(null)}
                className="p-1.5 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Document</h3>
                  <div className="p-3 rounded-lg bg-surface-100 border border-white/5 flex items-start gap-3 cursor-pointer hover:bg-white/5 transition-colors group">
                    <FileText className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground break-all">{activeSource.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 group-hover:text-brand-400 transition-colors">
                        View original <ExternalLink className="w-3 h-3" />
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Metrics</h3>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-100 border border-white/5">
                    <span className="text-xs text-muted-foreground">Retrieval Confidence</span>
                    <span className="text-xs font-mono font-medium text-success bg-success/10 px-2 py-0.5 rounded">
                      {(activeSource.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Extracted Context</h3>
                  <div className="p-4 rounded-lg bg-surface-100 border border-white/5 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 rounded-l-lg" />
                    <p className="text-sm text-foreground leading-relaxed italic">
                      "{activeSource.snippet}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
