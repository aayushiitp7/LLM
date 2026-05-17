'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, Search, Filter, MoreHorizontal, Download, Trash2, 
  Eye, FileSpreadsheet, FileIcon, ShieldAlert, CheckCircle2
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
  hidden: { opacity: 0, y: 5 },
  show: { opacity: 1, y: 0, transition: { type: 'tween', duration: 0.15 } }
}

const getIcon = (type: string) => {
  switch(type) {
    case 'excel': return <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
    case 'pdf': return <FileText className="w-4 h-4 text-foreground" />
    case 'word': return <FileText className="w-4 h-4 text-muted-foreground" />
    default: return <FileIcon className="w-4 h-4 text-muted-foreground" />
  }
}

const getStatusBadge = (status: string) => {
  switch(status) {
    case 'indexed': return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/10 border border-success/20 text-success text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3" /> Indexed</span>
    case 'processing': return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground text-[10px] font-bold uppercase tracking-wider"><div className="w-2 h-2 rounded-full border-2 border-foreground border-t-transparent animate-spin" /> Processing</span>
    case 'failed': return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-danger/10 border border-danger/20 text-danger text-[10px] font-bold uppercase tracking-wider"><ShieldAlert className="w-3 h-3" /> Failed</span>
    default: return null
  }
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and index enterprise knowledge files.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary">Upload Documents</button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 justify-between"
      >
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search files by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-ring transition-colors shadow-subtle"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Filter className="w-4 h-4" />
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
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-secondary/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border">
              <tr>
                <th scope="col" className="px-5 py-3">Filename</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3">Size</th>
                <th scope="col" className="px-5 py-3">Uploaded</th>
                <th scope="col" className="px-5 py-3">Owner</th>
                <th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {MOCK_DOCS.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase())).map((doc) => (
                <motion.tr 
                  variants={item} 
                  key={doc.id}
                  className="hover:bg-secondary/50 transition-colors group cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center shrink-0">
                      {getIcon(doc.type)}
                    </div>
                    <span className="truncate max-w-[200px] sm:max-w-xs">{doc.title}</span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {getStatusBadge(doc.status)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                    {doc.size}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                    {doc.date}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-medium text-muted-foreground">
                      {doc.user}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border transition-all">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 border border-transparent transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border transition-all">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {MOCK_DOCS.filter(doc => doc.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <div className="py-12 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground">No documents found</h3>
              <p className="text-xs text-muted-foreground mt-1">Adjust filters or upload a new file.</p>
            </div>
          )}
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-secondary/30">
          <span>Showing 1 to 6 of 124,592 entries</span>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 rounded border border-border bg-background opacity-50 cursor-not-allowed">Prev</button>
            <button className="px-2.5 py-1 rounded border border-border bg-background hover:bg-secondary transition-colors">Next</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
