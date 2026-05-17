'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Filter, FileText, Calendar, Layers, ArrowRight } from 'lucide-react'

const MOCK_RESULTS = [
  { id: 1, title: 'Q3 Financial Projections', type: 'Spreadsheet', relevance: 0.98, text: '...indicates a 14.5% YoY growth projection ($45.2M total) driven by strong renewal rates in the EMEA region...' },
  { id: 2, title: 'Data Center Expansion Budget', type: 'PDF Document', relevance: 0.85, text: '...operational costs (OpEx) for Q3 will increase by an estimated 4.2% to cover the new Frankfurt data center...' },
  { id: 3, title: 'Enterprise Sales Strategy Q3-Q4', type: 'Presentation', relevance: 0.76, text: '...aligning the sales force with the projected revenue models to capture the enterprise expansion market...' },
]

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      setHasSearched(true)
    }, 800)
  }

  return (
    <div className="h-full flex flex-col p-6 md:p-8 max-w-[1200px] mx-auto">
      
      {/* Search Header Container - Centered initially, transitions up when searched */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
        className={`w-full ${hasSearched ? 'mb-8' : 'flex-1 flex flex-col justify-center items-center pb-[20vh]'}`}
      >
        <motion.div layout className={`text-center w-full ${hasSearched ? 'text-left flex items-end justify-between' : 'mb-8'}`}>
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-3">
              <Sparkles className={`text-brand-400 ${hasSearched ? 'w-6 h-6' : 'w-8 h-8'}`} />
              Semantic Search
            </h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-xl mx-auto sm:mx-0">
              Instantly find insights, context, and exact passages across millions of enterprise documents.
            </p>
          </div>
        </motion.div>

        <motion.form 
          layout
          onSubmit={handleSearch}
          className="w-full relative max-w-3xl"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <div className="w-6 h-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            ) : (
              <Search className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for 'Q3 revenue projections' or 'HR policies'..."
            className="w-full h-16 bg-surface-200/80 backdrop-blur-xl border border-white/10 rounded-2xl pl-14 pr-6 text-lg text-foreground shadow-2xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-muted-foreground/70"
          />
          <button 
            type="button"
            className="absolute inset-y-2 right-2 px-4 rounded-xl bg-surface-100 hover:bg-white/10 border border-white/5 text-sm font-medium text-foreground transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </motion.form>

        {/* Example Chips */}
        {!hasSearched && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mt-6 max-w-2xl mx-auto"
          >
            <span className="text-xs font-medium text-muted-foreground mr-2 self-center">Try asking:</span>
            {['"Data center expansion costs"', '"Renewals in EMEA"', '"Vacation policy update"'].map((suggestion) => (
              <button 
                key={suggestion}
                onClick={() => { setQuery(suggestion.replace(/"/g, '')); setHasSearched(true) }}
                className="px-3 py-1.5 rounded-full bg-surface-100 border border-white/5 text-xs text-muted-foreground hover:text-foreground hover:border-brand-500/50 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Results Area */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0"
          >
            
            {/* Search Results List */}
            <div className="flex-1 flex flex-col overflow-y-auto pr-4 pb-12 space-y-4 scroll-smooth">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-sm font-medium text-muted-foreground">Found {MOCK_RESULTS.length} highly relevant passages</span>
                <span className="text-xs text-muted-foreground">Search took 0.42s</span>
              </div>
              
              {MOCK_RESULTS.map((result, idx) => (
                <motion.div 
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-5 rounded-xl bg-surface-200 border border-white/5 hover:border-brand-500/50 hover:bg-surface-100 transition-all group cursor-pointer shadow-card"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-brand-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground group-hover:text-brand-400 transition-colors">
                          {result.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> {result.type}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Updated 2d ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-2 py-1 rounded bg-success/10 border border-success/20 text-success text-xs font-mono font-medium">
                      {(result.relevance * 100).toFixed(1)}% Match
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-surface-300 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-500/50" />
                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                      "{result.text}"
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-brand-400 font-medium flex items-center gap-1">
                      View in Context <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Smart Filters Panel */}
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-0 bg-surface-200 border border-white/5 rounded-xl p-5 shadow-card">
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  Smart Filters
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Document Type</h4>
                    <div className="space-y-2">
                      {['All Types', 'PDF Documents', 'Spreadsheets', 'Presentations'].map((type, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm text-foreground cursor-pointer group">
                          <input type="checkbox" defaultChecked={i===0} className="rounded border-white/10 bg-surface-300 text-brand-500 focus:ring-brand-500" />
                          <span className="group-hover:text-brand-400 transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Date Range</h4>
                    <select className="w-full bg-surface-300 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-500">
                      <option>Any time</option>
                      <option>Past 24 hours</option>
                      <option>Past week</option>
                      <option>Past month</option>
                      <option>Past year</option>
                    </select>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Confidence Score</h4>
                    <input type="range" className="w-full accent-brand-500" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
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
