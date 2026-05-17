'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, FileText, X, ExternalLink, ShieldCheck } from 'lucide-react'
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
        content: 'I am operating in a read-only environment. Please configure the ingestion pipeline to process real queries.',
        sources: []
      }])
    }, 800)
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${activeSource ? 'mr-80' : ''}`}>
        
        {/* Header */}
        <header className="h-14 flex items-center px-6 border-b border-border bg-popover sticky top-0 z-10 shadow-subtle">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center border border-border">
              <Bot className="w-3.5 h-3.5 text-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-foreground">Financial Intelligence</h1>
              <span className="text-muted-foreground">/</span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-success" />
                Pipeline Active
              </p>
            </div>
          </div>
        </header>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-foreground" />
                  </div>
                )}
                
                <div className={`max-w-[85%] rounded-lg p-5 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground border border-primary' 
                    : 'bg-popover border border-border text-foreground shadow-subtle'
                }`}>
                  <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background prose-pre:border prose-pre:border-border prose-a:text-foreground prose-a:underline prose-a:underline-offset-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Inline Sources/Citations Container */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2">
                      {msg.sources.map((source: any, idx: number) => (
                        <button 
                          key={source.id}
                          onClick={() => setActiveSource(source)}
                          className="flex items-center gap-2 px-2.5 py-1 rounded bg-background border border-border text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>[{idx + 1}] {source.title.substring(0, 24)}...</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded bg-secondary border border-border flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-popover border-t border-border">
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your enterprise documents..." 
                className="w-full bg-background border border-border rounded-md pl-4 pr-12 py-3.5 text-sm text-foreground focus:outline-none focus:border-ring transition-colors shadow-subtle"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="text-center mt-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Verify generated responses with source material</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Inspector Side Panel */}
      <AnimatePresence>
        {activeSource && (
          <motion.div 
            key="evidence-inspector"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="w-80 border-l border-border bg-popover absolute right-0 top-0 bottom-0 z-20 shadow-modal flex flex-col"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Evidence
              </h2>
              <button 
                onClick={() => setActiveSource(null)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Source Document</h3>
                <div className="p-3 rounded bg-background border border-border flex items-start gap-3 cursor-pointer hover:bg-secondary transition-colors group">
                  <FileText className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-foreground break-all leading-tight">{activeSource.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1 group-hover:text-foreground transition-colors">
                      View Original <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Retrieval Metric</h3>
                <div className="flex items-center justify-between p-3 rounded bg-background border border-border">
                  <span className="text-xs text-muted-foreground">Confidence Score</span>
                  <span className="text-xs font-mono font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                    {(activeSource.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Extracted Context</h3>
                <div className="p-4 rounded bg-background border border-border">
                  <p className="text-xs text-foreground leading-relaxed">
                    {activeSource.snippet}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
