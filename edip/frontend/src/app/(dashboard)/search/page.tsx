'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, X, FileText, Clock, Tag, ChevronRight,
  Database, Zap, Filter, Star
} from 'lucide-react'

// ── Data ──────────────────────────────────────────────────────────────────────
const RECENT_SEARCHES = [
  'termination notice < 30 days',
  'invoice unpaid past 60 days',
  'employee non-compete clause 2026',
  'GDPR data retention policy',
]

const MOCK_RESULTS = [
  {
    id: '1',
    title: 'Client_Contract_AcmeCorp_MSA_2023.pdf',
    department: 'Legal',
    snippet: '§12.3 Either party may terminate this Agreement upon **14 days** written notice to the other party without cause, subject to any outstanding payment obligations.',
    score: 0.97,
    page: 8,
    type: 'Contract',
    tags: ['termination', 'notice-period', 'risk-high'],
  },
  {
    id: '2',
    title: 'Vendor_Agreement_DataSync_v2.pdf',
    department: 'Legal',
    snippet: 'For time-and-materials engagements, either party may terminate with **7 calendar days** written notice. Fixed-price projects require 30-day written notice.',
    score: 0.94,
    page: 3,
    type: 'Vendor Agreement',
    tags: ['termination', 'notice-period', 'vendor'],
  },
  {
    id: '3',
    title: 'CloudHost_DPA_SubProcessor.pdf',
    department: 'Legal',
    snippet: 'Termination of data processing activities shall be notified **21 days** in advance per GDPR Article 28. The controller must confirm in writing.',
    score: 0.89,
    page: 12,
    type: 'DPA',
    tags: ['gdpr', 'termination', 'data-processing'],
  },
  {
    id: '4',
    title: 'Employee_Handbook_2026_Final.pdf',
    department: 'HR',
    snippet: 'Standard notice period for non-executive employees is **30 days**. Directors and above are subject to a 90-day notice period as per employment contracts.',
    score: 0.81,
    page: 47,
    type: 'Policy',
    tags: ['notice-period', 'hr', 'employment'],
  },
]

function highlightBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <mark key={i} className="bg-foreground/15 text-foreground rounded px-0.5 font-semibold not-italic">{part.slice(2, -2)}</mark>
      : <React.Fragment key={i}>{part}</React.Fragment>
  )
}

const FILTER_OPTIONS = ['All', 'Legal', 'Finance', 'HR', 'Engineering', 'Executive']
const TYPE_OPTIONS = ['All Types', 'Contract', 'Policy', 'Invoice', 'Report', 'DPA']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeType, setActiveType] = useState('All Types')
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (q?: string) => {
    const s = (q || query).trim()
    if (!s) return
    if (q) setQuery(q)
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      setHasSearched(true)
    }, 600)
  }

  const results = MOCK_RESULTS.filter(r => {
    const matchFilter = activeFilter === 'All' || r.department === activeFilter
    const matchType = activeType === 'All Types' || r.type === activeType
    return matchFilter && matchType
  })

  return (
    <div className="page-container">

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-header">
        <div>
          <h1 className="page-title">Semantic Search</h1>
          <p className="page-description">Hybrid BM25 + vector retrieval across the entire document corpus.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Zap className="w-3 h-3 text-amber-400" />
          Avg latency: 420ms · 124,592 documents indexed
        </div>
      </motion.div>

      {/* Search box */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="relative mb-6">
        <div className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Which contracts have termination notice < 30 days?"
            className="input-field pl-11 pr-24 py-3.5 text-sm"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setHasSearched(false) }}
              className="absolute right-20 btn-icon w-7 h-7">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => handleSearch()}
            className="absolute right-2 btn-primary text-xs px-3 py-1.5">
            Search
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 ml-1">
          Queries use hybrid retrieval: BM25 sparse + dense semantic vectors + cross-encoder reranking
        </p>
      </motion.div>

      {/* Recent searches — shown before first search */}
      {!hasSearched && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="section-label">Recent Queries</p>
            </div>
            <div className="space-y-1">
              {RECENT_SEARCHES.map(s => (
                <button key={s} onClick={() => handleSearch(s)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-left group">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {s}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="section-label">Example Enterprise Queries</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { q: 'Summarize all invoices exceeding $100k in Q3', tag: 'Finance' },
                { q: 'Which employees have non-compete clauses expiring in 2026?', tag: 'HR' },
                { q: 'Find all contracts missing a limitation of liability clause', tag: 'Legal' },
                { q: 'What are our GDPR data retention obligations?', tag: 'Compliance' },
              ].map(ex => (
                <button key={ex.q} onClick={() => handleSearch(ex.q)}
                  className="premium-card p-4 text-left hover:border-muted-foreground/40 transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`badge badge-muted`}>{ex.tag}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                    {ex.q}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading state */}
      {isSearching && (
        <div className="space-y-3 mt-4">
          {[1,2,3].map(i => (
            <div key={i} className="premium-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-20 h-3 bg-secondary rounded animate-pulse" />
                <div className="w-12 h-3 bg-secondary rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-secondary rounded animate-pulse w-full" />
                <div className="h-3 bg-secondary rounded animate-pulse w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {hasSearched && !isSearching && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

          {/* Results header + filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm">
                <strong>{results.length}</strong> results for <strong className="italic">"{query}"</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {FILTER_OPTIONS.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    activeFilter === f ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Result cards */}
          <div className="space-y-3">
            {results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="premium-card p-5 hover:border-muted-foreground/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{result.title}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {result.department} · {result.type} · Page {result.page}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-bold font-mono-number text-emerald-400">{(result.score * 100).toFixed(0)}%</div>
                      <div className="text-[10px] text-muted-foreground">match</div>
                    </div>
                    <div className="w-1 h-8 bg-border rounded-full overflow-hidden">
                      <div className="w-full bg-emerald-400 rounded-full" style={{ height: `${result.score * 100}%` }} />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed ml-11">
                  {highlightBold(result.snippet)}
                </p>

                <div className="flex items-center gap-2 mt-3 ml-11">
                  {result.tags.map(tag => (
                    <span key={tag} className="badge badge-muted">{tag}</span>
                  ))}
                  <button className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    Open document <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  )
}
