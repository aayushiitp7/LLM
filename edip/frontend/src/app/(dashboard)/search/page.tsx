'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, FileText, Layers, ArrowRight } from 'lucide-react'

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
    }, 400) // Faster perception of speed
  }

  return (
    <div className="h-full flex flex-col p-6 md:p-8 max-w-[1200px] mx-auto">
      
      {/* Search Header Container */}
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, type: 'tween' }}
        className={`w-full ${hasSearched ? 'mb-6' : 'flex-1 flex flex-col justify-center items-center pb-[20vh]'}`}
      >
        <motion.div layout className={`text-center w-full ${hasSearched ? 'text-left flex items-end justify-between' : 'mb-6'}`}>
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <Search className={`text-foreground ${hasSearched ? 'w-5 h-5' : 'w-6 h-6'}`} />
              Semantic Search
            </h1>
            {!hasSearched && (
              <p className="text-muted-foreground mt-2 text-sm max-w-xl mx-auto sm:mx-0">
                Execute natural language queries across the global document index.
              </p>
            )}
          </div>
        </motion.div>

        <motion.form 
          layout
          onSubmit={handleSearch}
          className="w-full relative max-w-3xl"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {isSearching ? (
              <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for 'Q3 revenue projections'..."
            className="w-full bg-background border border-border rounded-md pl-11 pr-24 py-3 text-sm text-foreground shadow-subtle focus:outline-none focus:border-ring transition-colors placeholder:text-muted-foreground"
          />
          <button 
            type="button"
            className="absolute inset-y-1.5 right-1.5 px-3 rounded bg-secondary hover:bg-muted border border-border text-[10px] uppercase font-bold text-foreground transition-colors flex items-center gap-1.5 tracking-wider"
          >
            <Filter className="w-3 h-3" /> Filter
          </button>
        </motion.form>

        {/* Example Chips */}
        {!hasSearched && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto"
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-2 self-center">Examples:</span>
            {['"Data center costs"', '"EMEA Renewals"', '"Vacation policy"'].map((suggestion) => (
              <button 
                key={suggestion}
                onClick={() => { setQuery(suggestion.replace(/"/g, '')); setHasSearched(true) }}
                className="px-2.5 py-1 rounded bg-background border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
            key="search-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0"
          >
            
            {/* Search Results List */}
            <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-12 space-y-4 scroll-smooth">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Found {MOCK_RESULTS.length} matches</span>
                <span className="text-[10px] font-mono text-muted-foreground">0.42s</span>
              </div>
              
              {MOCK_RESULTS.map((result, idx) => (
                <motion.div 
                  key={result.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg bg-card border border-border hover:border-muted-foreground/30 transition-colors group cursor-pointer shadow-subtle"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-secondary border border-border flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground group-hover:underline underline-offset-2 decoration-muted-foreground">
                          {result.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-semibold"><Layers className="w-3 h-3" /> {result.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-1.5 py-0.5 rounded bg-success/10 border border-success/20 text-success text-[10px] font-mono font-bold">
                      {(result.relevance * 100).toFixed(1)}% Match
                    </div>
                  </div>
                  
                  <div className="p-3 rounded bg-background border border-border relative">
                    <p className="text-xs text-foreground leading-relaxed">
                      {result.text}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                      View Context <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Smart Filters Panel */}
            <div className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-0 bg-card border border-border rounded-lg p-4 shadow-subtle">
                <h3 className="text-[10px] font-bold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-foreground" />
                  Parameters
                </h3>
                
                <div className="space-y-5">
                  <div>
                    <h4 className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider">Document Type</h4>
                    <div className="space-y-1.5">
                      {['All Types', 'PDF Documents', 'Spreadsheets', 'Presentations'].map((type, i) => (
                        <label key={i} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                          <input type="checkbox" defaultChecked={i===0} className="rounded border-border bg-background text-primary focus:ring-ring" />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider">Date Range</h4>
                    <select className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-ring">
                      <option>Any time</option>
                      <option>Past 24 hours</option>
                      <option>Past week</option>
                    </select>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-bold text-foreground mb-2 uppercase tracking-wider">Min Confidence</h4>
                    <input type="range" className="w-full accent-foreground" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                      <span>0.0</span>
                      <span>1.0</span>
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
