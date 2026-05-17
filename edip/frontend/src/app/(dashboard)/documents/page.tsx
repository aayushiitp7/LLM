'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, Upload, Filter, Search, MoreVertical, 
  Download, Trash2, Eye, ShieldAlert, CheckCircle2, 
  Clock, X, FileUp
} from 'lucide-react'

// Dummy Data
const MOCK_DOCS = [
  { id: '1', name: 'Master Services Agreement - ACME Corp.pdf', type: 'Contract', department: 'Legal', status: 'Indexed', risk: 'Low', date: '2025-05-16', size: '2.4 MB' },
  { id: '2', name: 'Q1 Financial Report.xlsx', type: 'Report', department: 'Finance', status: 'Indexed', risk: 'Medium', date: '2025-05-15', size: '4.1 MB' },
  { id: '3', name: 'Employee Handbook v4.pdf', type: 'Policy', department: 'HR', status: 'Indexed', risk: 'Low', date: '2025-05-14', size: '1.2 MB' },
  { id: '4', name: 'Vendor Contract - TechFlow.pdf', type: 'Contract', department: 'Legal', status: 'Processing', risk: 'Pending', date: '2025-05-17', size: '5.5 MB' },
  { id: '5', name: 'Compliance Audit 2025.docx', type: 'Audit', department: 'Compliance', status: 'Failed', risk: 'High', date: '2025-05-12', size: '8.9 MB' },
]

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Trigger upload logic here
      setIsUploadModalOpen(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Document Explorer</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and upload documents across the enterprise.</p>
        </div>
        
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search documents by name, type, or department..."
            className="input-primary pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="glass-card px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Document Table */}
      <div className="glass-card rounded-xl overflow-hidden flex-1 border border-white/5">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Risk Level</th>
                <th>Size</th>
                <th>Date Added</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DOCS.map((doc, i) => (
                <motion.tr 
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-brand-500/10 flex items-center justify-center text-brand-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">{doc.type}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="px-2 py-1 rounded bg-white/5 text-xs text-muted-foreground">
                      {doc.department}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 text-xs">
                      {doc.status === 'Indexed' && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                      {doc.status === 'Processing' && <Clock className="w-3.5 h-3.5 text-warning animate-pulse" />}
                      {doc.status === 'Failed' && <X className="w-3.5 h-3.5 text-destructive" />}
                      <span className={
                        doc.status === 'Indexed' ? 'text-success' : 
                        doc.status === 'Processing' ? 'text-warning' : 'text-destructive'
                      }>
                        {doc.status}
                      </span>
                    </div>
                  </td>
                  <td>
                    {doc.risk === 'Low' && <span className="risk-low">Low</span>}
                    {doc.risk === 'Medium' && <span className="risk-medium">Med</span>}
                    {doc.risk === 'High' && <span className="risk-high">High</span>}
                    {doc.risk === 'Pending' && <span className="badge-gray">Pending</span>}
                  </td>
                  <td className="text-muted-foreground">{doc.size}</td>
                  <td className="text-muted-foreground">{doc.date}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-white/10" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-brand-400 rounded hover:bg-white/10" title="Download Original">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-white/10" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsUploadModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
            >
              <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-surface-200">
                  <h3 className="font-semibold text-foreground">Upload Documents</h3>
                  <button onClick={() => setIsUploadModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      dragActive ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-black/20 hover:border-brand-500/50 hover:bg-white/5'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-300 mx-auto flex items-center justify-center mb-4 border border-white/5">
                      <FileUp className="w-6 h-6 text-brand-400" />
                    </div>
                    <div className="text-base font-medium text-foreground mb-1">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      PDF, DOCX, XLSX, PNG, JPG (max. 50MB)
                    </div>
                    <label className="btn-primary cursor-pointer inline-flex">
                      Select Files
                      <input type="file" className="hidden" multiple accept=".pdf,.docx,.xlsx,.png,.jpg" />
                    </label>
                  </div>
                  
                  <div className="mt-4 p-4 rounded-lg bg-surface-300 border border-white/5">
                    <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-brand-400" />
                      Processing Pipeline
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Uploaded documents are automatically processed through our secure pipeline: OCR extraction, semantic chunking, embedding generation, and full-text indexing. Large PDFs may take several minutes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
