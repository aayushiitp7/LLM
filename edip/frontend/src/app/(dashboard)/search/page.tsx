'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, FileText, ChevronRight, SlidersHorizontal, BookOpen } from 'lucide-react'

const MOCK_RESULTS = [
  {
    id: '1',
    document_title: 'Master Services Agreement - ACME Corp.pdf',
    page_number: 12,
    section_title: '14. Limitation of Liability',
    content: '...In no event shall either party be liable for any <mark class="highlight">indirect, incidental, or consequential damages</mark> arising out of this agreement. The total liability of the Provider shall not exceed the total fees paid by the Client in the twelve (12) months preceding the claim...',
    score: 0.94,
    department: 'Legal',
    type: 'Contract',
    strategy: 'Hybrid (RRF)'
  },
  {
    id: '2',
    document_title: 'Employee Handbook v4.pdf',
    page_number: 45,
    section_title: 'IT Security Policy',
    content: '...Employees must report any loss of company devices immediately to the IT helpdesk. Failure to do so may result in <mark class="highlight">liability</mark> for unauthorized access or <mark class="highlight">damages</mark> resulting from data breaches...',
    score: 0.82,
    department: 'HR',
    type: 'Policy',
    strategy: 'Hybrid (RRF)'
  }
]

export default function SearchPage() {
  const [query, setQuery] = useState('liability for indirect damages')
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(true)

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
    <div className="h-full flex flex-col bg-surface-300">
      
      {/* Search Header */}
      <div className="bg-surface-200 border-b border-white/5 p-6 pt-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold font-display text-foreground mb-6 flex items-center gap-2">
            <Search className="w-6 h-6 text-brand-400" />
            Semantic Enterprise Search
          </h1>
          
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all documents semantically..."
              className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-32 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all text-lg shadow-inner"
            />
            <div className="absolute inset-y-2 right-2 flex gap-2">
              <button type="button" className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors">
                <SlidersHorizontal className="w-5 h-5" />
              </button>
              <button 
                type="submit"
                disabled={isSearching}
                className="btn-primary px-6 rounded-xl"
              >
                {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Search'}
              </button>
            </div>
          </form>

          <div className="flex gap-2 mt-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Suggested:</span>
            <button className="hover:text-brand-400">indemnification clauses</button> • 
            <button className="hover:text-brand-400">Q3 revenue figures</button> • 
            <button className="hover:text-brand-400">remote work policy</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto flex gap-6 p-6">
          
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0 space-y-6 hidden lg:block">
            <div className="glass-card p-4 rounded-xl border border-white/5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4" />
                Refine Results
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Department</div>
                  <div className="space-y-2">
                    {['Legal', 'Finance', 'HR', 'Engineering'].map(dept => (
                      <label key={dept} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="checkbox" className="rounded border-white/10 bg-black/20 text-brand-500 focus:ring-brand-500/50" />
                        {dept}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Document Type</div>
                  <div className="space-y-2">
                    {['Contract', 'Policy', 'Report', 'Invoice'].map(type => (
                      <label key={type} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input type="checkbox" className="rounded border-white/10 bg-black/20 text-brand-500 focus:ring-brand-500/50" />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Retrieval Strategy</div>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50">
                    <option>Hybrid (Dense + Sparse)</option>
                    <option>Semantic (Vector only)</option>
                    <option>Keyword (BM25 only)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 max-w-4xl">
            {hasSearched ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Found 24 results for "{query}" in 0.42s
                </div>

                {MOCK_RESULTS.map((result, i) => (
                  <motion.div 
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card rounded-xl p-5 border border-white/5 hover:border-brand-500/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-8 rounded bg-brand-500/10 flex items-center justify-center text-brand-400 flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-brand-400 group-hover:underline">
                            {result.document_title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="badge-gray">{result.department}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              Page {result.page_number}
                            </span>
                            <span>•</span>
                            <span>{result.section_title}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Relevance Score */}
                      <div className="flex flex-col items-end">
                        <div className="text-xs text-muted-foreground mb-1">Match Score</div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-1.5 rounded-sm"
                              style={{ background: i < Math.round(result.score * 5) ? '#3b5fff' : 'rgba(255,255,255,0.1)' }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-lg p-4 border border-white/[0.02]">
                      <p 
                        className="text-sm text-foreground/80 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: result.content }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                <p>Enter a query to search across the enterprise corpus.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
