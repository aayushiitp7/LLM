'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, Upload, Filter, MoreHorizontal, Download,
  Trash2, Eye, FileSpreadsheet, FileArchive, CheckCircle2,
  ShieldAlert, Loader2, ChevronDown, X, Plus, FolderOpen
} from 'lucide-react'

// ── Types + Data ──────────────────────────────────────────────────────────────
type DocStatus = 'indexed' | 'processing' | 'failed' | 'queued'
type DocType = 'pdf' | 'excel' | 'word' | 'zip' | 'email' | 'image'

interface Doc {
  id: string
  title: string
  type: DocType
  size: string
  status: DocStatus
  date: string
  user: string
  pages?: number
  riskScore?: number
  department: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const TYPE_ICON: Record<DocType, React.ReactNode> = {
  pdf: <FileText className="w-3.5 h-3.5" />,
  excel: <FileSpreadsheet className="w-3.5 h-3.5" />,
  word: <FileText className="w-3.5 h-3.5" />,
  zip: <FileArchive className="w-3.5 h-3.5" />,
  email: <FileText className="w-3.5 h-3.5" />,
  image: <FileText className="w-3.5 h-3.5" />,
}

const StatusBadge = ({ status }: { status: DocStatus }) => {
  const configs = {
    indexed: { cls: 'badge-success', icon: <CheckCircle2 className="w-2.5 h-2.5" />, label: 'Indexed' },
    processing: { cls: 'badge-info', icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />, label: 'Processing' },
    failed: { cls: 'badge-danger', icon: <ShieldAlert className="w-2.5 h-2.5" />, label: 'Failed' },
    queued: { cls: 'badge-muted', icon: <Loader2 className="w-2.5 h-2.5" />, label: 'Queued' },
  }
  const { cls, icon, label } = configs[status]
  return (
    <span className={cls + ' badge'}>
      {icon}
      {label}
    </span>
  )
}

const RiskChip = ({ score }: { score?: number }) => {
  if (!score) return <span className="text-[10px] text-muted-foreground">—</span>
  const cls = score > 70 ? 'text-red-400 bg-red-400/10' : score > 40 ? 'text-amber-400 bg-amber-400/10' : 'text-emerald-400 bg-emerald-400/10'
  return (
    <span className={`inline-block text-[10px] font-bold font-mono-number px-1.5 py-0.5 rounded ${cls}`}>
      {score}
    </span>
  )
}

// ── Drag and drop upload zone ─────────────────────────────────────────────────
function UploadZone({ onClose, onUploadSuccess }: { onClose: () => void, onUploadSuccess?: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        
        await fetch(`${API_BASE}/api/v1/ingestion/upload`, {
          method: "POST",
          headers: { "Authorization": "Bearer local" },
          body: formData
        });
      }
      if (onUploadSuccess) onUploadSuccess();
      onClose();
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="premium-card p-6 border-dashed"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Upload Documents</h3>
        <button onClick={onClose} className="btn-icon w-6 h-6"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false) }}
        className={`rounded-lg border-2 border-dashed transition-all py-12 flex flex-col items-center gap-3 cursor-pointer ${
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground hover:bg-secondary/30'
        }`}
      >
        <Upload className={`w-8 h-8 transition-colors ${dragging ? 'text-foreground' : 'text-muted-foreground'}`} />
        <div className="text-center">
          <p className="text-sm font-medium">{dragging ? 'Release to upload' : 'Drop files here'}</p>
          <p className="text-[10px] text-muted-foreground mt-1">PDF, DOCX, XLSX, ZIP, PNG · Max 100MB</p>
        </div>
        <label className={`btn-secondary text-xs cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? 'Uploading...' : 'Browse Files'}
          <input type="file" multiple className="hidden" accept=".pdf,.docx,.xlsx,.zip,.png,.jpg" onChange={e => handleFiles(e.target.files)} />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
        <div className="premium-card p-2 text-center">OCR Auto-detect</div>
        <div className="premium-card p-2 text-center">Metadata Extract</div>
        <div className="premium-card p-2 text-center">Auto Embedding</div>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [docs, setDocs] = useState<Doc[]>([])
  
  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/documents`, {
        headers: { 'Authorization': 'Bearer local' }
      })
      if (res.ok) {
        const data = await res.json()
        setDocs((data.items || []).map((d:any) => ({
          id: d.id,
          title: d.filename || d.title,
          type: (d.title||'').toLowerCase().endsWith('.pdf') ? 'pdf' : 'word',
          size: d.file_size_bytes ? `${(d.file_size_bytes/1024/1024).toFixed(1)} MB` : 'Unknown',
          status: d.status || 'indexed',
          date: new Date(d.created_at).toLocaleDateString(),
          user: 'System',
          pages: d.page_count,
          department: d.department || 'General'
        })))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])
  
  React.useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const filtered = docs.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
                        (doc.department || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || doc.status === filter || (doc.department||'').toLowerCase() === filter
    return matchSearch && matchFilter
  })

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
  const row = { hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0, transition: { duration: 0.15 } } }

  return (
    <div className="page-container space-y-5">

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-header">
        <div>
          <h1 className="page-title">Document Corpus</h1>
          <p className="page-description">Manage, index, and inspect all enterprise knowledge files.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary text-xs" onClick={() => setShowUpload(v => !v)}>
            <Upload className="w-3.5 h-3.5" />
            Upload
          </button>
          <button className="btn-primary text-xs">
            <FolderOpen className="w-3.5 h-3.5" />
            Browse Corpus
          </button>
        </div>
      </motion.div>

      {/* Upload zone */}
      <AnimatePresence>
        {showUpload && <UploadZone onClose={() => setShowUpload(false)} onUploadSuccess={fetchDocs} />}
      </AnimatePresence>

      {/* Stats strip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-px premium-card overflow-hidden">
        {[
          { label: 'Total Files', value: '124,592' },
          { label: 'Indexed', value: '122,841' },
          { label: 'Processing', value: '1,209' },
          { label: 'Failed', value: '542' },
        ].map(s => (
          <div key={s.label} className="p-4 text-center bg-card">
            <div className="text-lg font-bold font-mono-number">{s.value}</div>
            <div className="section-label mt-0.5">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            placeholder="Search by filename or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          {['all', 'indexed', 'processing', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {f}
            </button>
          ))}
          {selectedIds.size > 0 && (
            <button className="btn-danger text-xs ml-2">
              <Trash2 className="w-3.5 h-3.5" />
              Delete {selectedIds.size}
            </button>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="premium-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="w-8">
                  <input
                    type="checkbox"
                    className="rounded"
                    onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(d => d.id)) : new Set())}
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                  />
                </th>
                <th>Document</th>
                <th>Status</th>
                <th>Risk Score</th>
                <th>Department</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <motion.tr key={doc.id} variants={row} className="group cursor-pointer">
                  <td className="w-8">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedIds.has(doc.id)}
                      onChange={() => toggleSelect(doc.id)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded border border-border bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                        {TYPE_ICON[doc.type]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{doc.title}</p>
                        {doc.pages && <p className="text-[10px] text-muted-foreground">{doc.pages} pages</p>}
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={doc.status} /></td>
                  <td><RiskChip score={doc.riskScore} /></td>
                  <td>
                    <span className="text-[10px] bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                      {doc.department}
                    </span>
                  </td>
                  <td className="text-xs text-muted-foreground font-mono-number">{doc.size}</td>
                  <td className="text-xs text-muted-foreground">{doc.date}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="btn-icon w-7 h-7"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="btn-icon w-7 h-7"><Download className="w-3.5 h-3.5" /></button>
                      <button className="btn-icon w-7 h-7 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      <button className="btn-icon w-7 h-7"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-semibold">No documents found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try adjusting the search or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Showing {filtered.length} of 124,592 documents
          </span>
          <div className="flex gap-1">
            <button className="text-xs px-2.5 py-1 rounded border border-border text-muted-foreground disabled:opacity-40" disabled>Prev</button>
            <button className="text-xs px-2.5 py-1 rounded border border-border hover:bg-secondary transition-colors">Next</button>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
