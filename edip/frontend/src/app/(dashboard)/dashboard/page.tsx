'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import {
  Files, BrainCircuit, Users, Clock, ArrowUpRight, ArrowDownRight,
  Activity, TrendingUp, AlertTriangle, CheckCircle2, Zap, Database
} from 'lucide-react'
import Link from 'next/link'

// ── Data ─────────────────────────────────────────────────────────────────────
const queryVolumeData = [
  { day: 'Mon', queries: 2840, indexed: 1240 },
  { day: 'Tue', queries: 3200, indexed: 890 },
  { day: 'Wed', queries: 2100, indexed: 3400 },
  { day: 'Thu', queries: 3900, indexed: 1800 },
  { day: 'Fri', queries: 4200, indexed: 2200 },
  { day: 'Sat', queries: 1800, indexed: 960 },
  { day: 'Sun', queries: 2100, indexed: 1100 },
]

const docTypeData = [
  { name: 'Legal', value: 32 },
  { name: 'Finance', value: 28 },
  { name: 'HR', value: 22 },
  { name: 'Technical', value: 18 },
]
const PIE_COLORS = ['#e4e4e7', '#a1a1aa', '#71717a', '#52525b']

const confidenceData = [
  { range: '90–100%', count: 1840 },
  { range: '80–90%', count: 2210 },
  { range: '70–80%', count: 980 },
  { range: '60–70%', count: 340 },
  { range: '<60%', count: 90 },
]

const activityLog = [
  { id: 1, type: 'index', icon: Database, message: 'Q3_Financial_Report_v2.pdf indexed', meta: '2m ago', user: 'System', status: 'success' },
  { id: 2, type: 'query', icon: BrainCircuit, message: 'RAG query: "Revenue projections EMEA Q4"', meta: '14m ago', user: 'Alice Chen', status: 'success' },
  { id: 3, type: 'alert', icon: AlertTriangle, message: 'Contract_AcmeCorp.pdf — high risk clauses detected', meta: '1h ago', user: 'Compliance Bot', status: 'warning' },
  { id: 4, type: 'user', icon: Users, message: 'User robert.smith@corp.com provisioned (Analyst role)', meta: '2h ago', user: 'Admin', status: 'info' },
  { id: 5, type: 'index', icon: Database, message: 'Employee_Handbook_2026.docx indexed successfully', meta: '3h ago', user: 'System', status: 'success' },
  { id: 6, type: 'query', icon: BrainCircuit, message: 'RAG query: "Which invoices are unpaid past 60 days?"', meta: '4h ago', user: 'Finance Ops', status: 'success' },
]

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-muted-foreground">
          <span className="font-medium text-foreground">{p.value.toLocaleString()}</span> {p.name}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="page-container space-y-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="page-header"
      >
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="page-description">Real-time operational intelligence and system health.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-secondary text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All Systems Operational
          </div>
          <Link href="/documents" className="btn-primary text-xs">Upload Document</Link>
        </div>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Documents', value: '124,592', change: '+12.5%', up: true, icon: Files, sub: 'In knowledge index' },
          { label: 'AI Queries (7d)', value: '32,408', change: '+24.1%', up: true, icon: BrainCircuit, sub: 'RAG pipeline executions' },
          { label: 'Active Users', value: '1,429', change: '-2.4%', up: false, icon: Users, sub: 'Across all departments' },
          { label: 'Avg Latency', value: '420ms', change: '-18%', up: true, icon: Clock, sub: 'End-to-end retrieval' },
        ].map((kpi, i) => (
          <motion.div key={i} variants={fadeUp} className="premium-card p-5 hover:border-border/60 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center">
                <kpi.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className={`flex items-center gap-0.5 text-[10px] font-bold ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <div className="text-2xl font-bold tracking-tight font-mono-number mb-1">{kpi.value}</div>
            <div className="section-label">{kpi.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts Row ────────────────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Main area chart */}
        <motion.div variants={fadeUp} className="premium-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold">Query Volume & Indexing</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">7-day rolling window</p>
            </div>
            <select className="text-xs bg-secondary border border-border rounded-md px-2 py-1 text-foreground outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={queryVolumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gQ" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e4e4e7" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#e4e4e7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#71717a" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(240 3.7% 14%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} dy={6} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="queries" name="Queries" stroke="#e4e4e7" strokeWidth={1.5} fill="url(#gQ)" />
              <Area type="monotone" dataKey="indexed" name="Indexed" stroke="#71717a" strokeWidth={1.5} fill="url(#gI)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-3 h-0.5 bg-zinc-200 rounded" /> Queries
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-3 h-0.5 bg-zinc-500 rounded" /> Documents Indexed
            </div>
          </div>
        </motion.div>

        {/* Donut chart */}
        <motion.div variants={fadeUp} className="premium-card p-5">
          <div className="mb-5">
            <h2 className="text-sm font-semibold">Document Distribution</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">By department</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={docTypeData} dataKey="value"
                cx="50%" cy="50%"
                innerRadius={45} outerRadius={70}
                paddingAngle={2} stroke="none"
              >
                {docTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {docTypeData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-mono-number font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Confidence + Activity ─────────────────────────────────────── */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Confidence histogram */}
        <motion.div variants={fadeUp} className="premium-card p-5 lg:col-span-2">
          <div className="mb-5">
            <h2 className="text-sm font-semibold">RAG Confidence Distribution</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Answer confidence scores across {(5460).toLocaleString()} queries</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={confidenceData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(240 3.7% 14%)" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 9, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(240 5% 55%)' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Queries" radius={[2, 2, 0, 0]}>
                {confidenceData.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? '#e4e4e7' : i < 4 ? '#71717a' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* System log */}
        <motion.div variants={fadeUp} className="premium-card overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold">System Activity Log</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
          <div className="divide-y divide-border">
            {activityLog.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group cursor-pointer">
                <div className={`w-7 h-7 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                  log.status === 'success' ? 'border-border bg-secondary' :
                  log.status === 'warning' ? 'border-amber-400/20 bg-amber-400/10' : 'border-blue-400/20 bg-blue-400/10'
                }`}>
                  <log.icon className={`w-3.5 h-3.5 ${
                    log.status === 'success' ? 'text-muted-foreground' :
                    log.status === 'warning' ? 'text-amber-400' : 'text-blue-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-tight">{log.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{log.user} · {log.meta}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 border-t border-border bg-muted/20">
            <button className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
              View Full Audit Log →
            </button>
          </div>
        </motion.div>
      </motion.div>

    </div>
  )
}
