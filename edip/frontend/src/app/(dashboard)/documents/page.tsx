'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Search, Filter, MoreHorizontal, Download, Trash2, 
  Eye, FileSpreadsheet, FileIcon, ShieldAlert, ArrowUpRight, CheckCircle2
} from 'lucide-react'

// --- Mock Data ---
const MOCK_DOCS = [
  { id: '1', title: 'Q3_Financial_Projections_v4.xlsx', type: 'excel', size: '2.4 MB', status: 'indexed', date: '2 hours ago', user: 'Alice Chen' },
  { id: '2', title: 'Data_Center_Expansion_Budget.pdf', type: 'pdf', size: '8.1 MB', status: 'processing', date: '4 hours ago', user: 'System' },
  { id: '3', title: 'Employee_Handbook_2026.pdf', type: 'pdf', size: '15.2 MB', status: 'indexed', date: 'Yesterday', user: 'HR Dept' },
  { id: '4', title: 'API_Architecture_Review.docx', type: 'word', size: '1.1 MB', status: 'failed', date: 'Yesterday', user: 'Engineering' },
  { id: '5', title: 'Client_Contract_AcmeCorp.pdf', type: 'pdf', size: '4.5 MB', status: 'indexed', date: 'Oct 12', user: 'Legal' },
  { id: '6', title: 'Q2_Marketing_Assets.zip', type: 'zip', size: '142 MB', status: 'indexed', date: 'Oct 10', user: 'Marketing' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

const getIcon = (type: string) => {
  switch(type) {
    case 'excel': return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
    case 'pdf': return <FileText className="w-5 h-5 text-brand-400" />
    case 'word': return <FileText className="w-5 h-5 text-blue-400" />
    default: return <FileIcon className="w-5 h-5 text-muted-foreground" />
  }
}

const getStatusBadge = (status: string) => {
  switch(status) {
    case 'indexed': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-success text-[10px] font-semibold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Indexed</span>
    case 'processing': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-semibold uppercase tracking-wider"><div className="w-3 h-3 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" /> Processing</span>
    case 'failed': return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-semibold uppercase tracking-wider"><ShieldAlert className="w-3 h-3" /> Failed</span>
    default: return null
  }
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage and index enterprise knowledge files.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary">Upload Documents</button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 justify-between"
      >
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search files by name or content..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-200 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-inner-glow"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-surface-200 border border-white/10 rounded-lg hover:bg-surface-100 transition-colors">
            <Filter className="w-4 h-4 text-muted-foreground" />
            Filter
          </button>
        </div>
      </motion.div>

      {/* Data Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="premium-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-surface-200/50 text-xs uppercase font-semibold text-muted-foreground border-b border-white/5">
              <tr>
                <th scope="col" className="px-6 py-4">Filename</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Size</th>
                <th scope="col" className="px-6 py-4">Uploaded</th>
                <th scope="col" className="px-6 py-4">Owner</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-surface-300">
              {MOCK_DOCS.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase())).map((doc) => (
                <motion.tr 
                  variants={item} 
                  key={doc.id}
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface-100 border border-white/5 flex items-center justify-center shrink-0">
                      {getIcon(doc.type)}
                    </div>
                    <span className="truncate max-w-[200px] sm:max-w-xs">{doc.title}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded bg-surface-100 border border-white/5 text-xs">
                      {doc.user}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded text-muted-foreground hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {MOCK_DOCS.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <div className="py-16 text-center">
              <FileText className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No documents found</h3>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search filters.</p>
            </div>
          )}
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-white/5 bg-surface-200/50 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing 1 to 6 of 124,592 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-white/5 bg-surface-100 opacity-50 cursor-not-allowed">Prev</button>
            <button className="px-3 py-1 rounded border border-white/5 bg-surface-200 hover:bg-surface-100 transition-colors">Next</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
