'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, FileText, MessageSquare,
  Clock, Zap, AlertTriangle, Shield, Activity,
  ChevronUp, ChevronDown, BarChart3, Users,
} from 'lucide-react'

// ─── Sample Analytics Data ────────────────────────────────────────────────

const uploadVolumeData = [
  { date: 'May 11', uploads: 145, ocr: 138, indexed: 130 },
  { date: 'May 12', uploads: 223, ocr: 210, indexed: 205 },
  { date: 'May 13', uploads: 189, ocr: 185, indexed: 180 },
  { date: 'May 14', uploads: 312, ocr: 300, indexed: 295 },
  { date: 'May 15', uploads: 278, ocr: 270, indexed: 265 },
  { date: 'May 16', uploads: 401, ocr: 390, indexed: 385 },
  { date: 'May 17', uploads: 356, ocr: 345, indexed: 340 },
]

const queryLatencyData = [
  { time: '00:00', retrieval: 320, generation: 1800, total: 2200 },
  { time: '04:00', retrieval: 280, generation: 1600, total: 1980 },
  { time: '08:00', retrieval: 450, generation: 2100, total: 2650 },
  { time: '12:00', retrieval: 890, generation: 3200, total: 4200 },
  { time: '16:00', retrieval: 720, generation: 2800, total: 3600 },
  { time: '20:00', retrieval: 540, generation: 2400, total: 3050 },
  { time: '23:59', retrieval: 380, generation: 1900, total: 2380 },
]

const documentTypeData = [
  { name: 'Contracts', value: 34, color: '#fafafa' },
  { name: 'Policies', value: 22, color: '#d4d4d8' },
  { name: 'Invoices', value: 18, color: '#a1a1aa' },
  { name: 'Reports', value: 14, color: '#71717a' },
  { name: 'HR Docs', value: 8, color: '#52525b' },
  { name: 'Other', value: 4, color: '#3f3f46' },
]

const ragQualityData = [
  { week: 'W1', faithfulness: 0.88, relevancy: 0.82, precision: 0.91, hallucination: 0.04 },
  { week: 'W2', faithfulness: 0.91, relevancy: 0.85, precision: 0.93, hallucination: 0.03 },
  { week: 'W3', faithfulness: 0.89, relevancy: 0.87, precision: 0.92, hallucination: 0.035 },
  { week: 'W4', faithfulness: 0.94, relevancy: 0.90, precision: 0.95, hallucination: 0.02 },
  { week: 'W5', faithfulness: 0.93, relevancy: 0.91, precision: 0.96, hallucination: 0.022 },
]

const riskHeatmapData = [
  { dept: 'Legal', low: 45, medium: 28, high: 12, critical: 3 },
  { dept: 'Finance', low: 67, medium: 15, high: 8, critical: 1 },
  { dept: 'HR', low: 89, medium: 7, high: 2, critical: 0 },
  { dept: 'Insurance', low: 34, medium: 41, high: 18, critical: 5 },
  { dept: 'Compliance', low: 23, medium: 52, high: 22, critical: 8 },
  { dept: 'Operations', low: 78, medium: 12, high: 4, critical: 0 },
]

const tokenUsageData = [
  { provider: 'GPT-4o', tokens: 2840000, cost: 28.40, queries: 1240 },
  { provider: 'Claude 3.5', tokens: 1560000, cost: 23.40, queries: 680 },
  { provider: 'Gemini Pro', tokens: 820000, cost: 10.25, queries: 340 },
  { provider: 'Ollama', tokens: 4200000, cost: 0, queries: 1800 },
]

// ─── Metric Card ──────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit,
  change,
  changePositive,
  icon: Icon,
  subvalue,
}: {
  label: string
  value: string
  unit?: string
  change?: string
  changePositive?: boolean
  icon: React.ElementType
  subvalue?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border p-5 rounded-lg shadow-subtle group cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 rounded border border-border bg-secondary flex items-center justify-center">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              changePositive
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-danger/10 text-danger border-danger/20'
            }`}
          >
            {changePositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-2xl font-bold font-mono text-foreground tracking-tight">
          {value}
          {unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
        </div>
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</div>
        {subvalue && (
          <div className="text-[10px] text-muted-foreground mt-1">{subvalue}</div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-popover border border-border rounded shadow-modal px-3 py-2 text-xs">
      <div className="text-muted-foreground mb-2 font-bold uppercase tracking-wider text-[10px]">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
          </div>
          <span className="font-mono font-bold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Risk Heatmap ─────────────────────────────────────────────────────────

function RiskHeatmap() {
  return (
    <div className="overflow-x-auto border border-border rounded-lg bg-card">
      <table className="w-full text-left text-xs">
        <thead className="bg-secondary/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border">
          <tr>
            <th className="px-4 py-3">Department</th>
            {['Low', 'Medium', 'High', 'Critical'].map((level) => (
              <th key={level} className="px-4 py-3 text-center">{level}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {riskHeatmapData.map((row, i) => (
            <motion.tr
              key={row.dept}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className="hover:bg-secondary/30 transition-colors"
            >
              <td className="px-4 py-3 font-semibold text-foreground">{row.dept}</td>
              {[
                { val: row.low, max: 100 },
                { val: row.medium, max: 60 },
                { val: row.high, max: 25 },
                { val: row.critical, max: 10 },
              ].map((cell, j) => (
                <td key={j} className="px-4 py-3 text-center">
                  <div
                    className={`mx-auto w-10 py-1 rounded border text-[10px] font-mono font-bold transition-colors ${
                      cell.val === 0
                        ? 'bg-background border-border text-muted-foreground'
                        : j === 0
                        ? 'bg-success/10 border-success/20 text-success'
                        : j === 1
                        ? 'bg-warning/10 border-warning/20 text-warning'
                        : j === 2
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                        : 'bg-danger/10 border-danger/20 text-danger'
                    }`}
                  >
                    {cell.val}
                  </div>
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h2>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">{subtitle}</p>}
    </div>
  )
}

// ─── Main Analytics Dashboard ─────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time platform metrics and AI quality indicators
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded bg-secondary border border-border">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Documents Processed"
          value="24,891"
          change="+12.3%"
          changePositive
          icon={FileText}
          subvalue="vs. last period"
        />
        <MetricCard
          label="AI Queries Today"
          value="1,247"
          change="+8.7%"
          changePositive
          icon={MessageSquare}
          subvalue="Avg 4 per active user"
        />
        <MetricCard
          label="Avg Retrieval Time"
          value="487"
          unit="ms"
          change="-15.2%"
          changePositive
          icon={Clock}
          subvalue="P95: 920ms"
        />
        <MetricCard
          label="RAG Faithfulness"
          value="94.3%"
          change="+2.1%"
          changePositive
          icon={Shield}
          subvalue="Hallucination rate: 2.1%"
        />
      </div>

      {/* Row 2: Upload Volume + RAG Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Upload Volume Chart */}
        <div className="bg-card border border-border rounded-lg p-5">
          <SectionHeader
            title="Document Processing Volume"
            subtitle="Uploads → OCR → Indexed pipeline"
          />
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={uploadVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="uploads"
                name="Uploads"
                stroke="#fafafa"
                strokeWidth={1.5}
                fillOpacity={0.1}
                fill="#fafafa"
              />
              <Area
                type="monotone"
                dataKey="indexed"
                name="Indexed"
                stroke="#52525b"
                strokeWidth={1.5}
                fillOpacity={0.1}
                fill="#52525b"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* RAG Quality Metrics */}
        <div className="bg-card border border-border rounded-lg p-5">
          <SectionHeader
            title="RAG Quality Metrics"
            subtitle="Weekly faithfulness, relevancy, and precision"
          />
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ragQualityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis
                tick={{ fontSize: 10, fill: '#a1a1aa' }}
                axisLine={false}
                tickLine={false}
                domain={[0.7, 1.0]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                dx={-10}
              />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', color: '#a1a1aa' }} />
              <Line type="monotone" dataKey="faithfulness" name="Faithfulness" stroke="#fafafa" strokeWidth={1.5} dot={{ fill: '#fafafa', r: 3 }} />
              <Line type="monotone" dataKey="relevancy" name="Relevancy" stroke="#a1a1aa" strokeWidth={1.5} dot={{ fill: '#a1a1aa', r: 3 }} />
              <Line type="monotone" dataKey="precision" name="Precision" stroke="#52525b" strokeWidth={1.5} dot={{ fill: '#52525b', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Risk Heatmap + Document Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Risk Heatmap */}
        <div className="bg-card border border-border rounded-lg p-5 lg:col-span-2">
          <SectionHeader
            title="Risk Distribution Heatmap"
            subtitle="Document risk levels by department"
          />
          <RiskHeatmap />
        </div>

        {/* Document Type Breakdown */}
        <div className="bg-card border border-border rounded-lg p-5">
          <SectionHeader
            title="Document Types"
            subtitle="By category"
          />
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={documentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {documentTypeData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {documentTypeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between px-2 py-1 bg-background border border-border rounded">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Token Usage + Latency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LLM Token Usage */}
        <div className="bg-card border border-border rounded-lg p-5">
          <SectionHeader
            title="LLM Token Usage & Cost"
            subtitle="By provider this month"
          />
          <div className="space-y-4">
            {tokenUsageData.map((provider, i) => (
              <motion.div
                key={provider.provider}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.2 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-24 text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                  {provider.provider}
                </div>
                <div className="flex-1">
                  <div className="h-1.5 w-full bg-background border border-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground transition-all duration-1000"
                      style={{
                        width: `${(provider.tokens / 4200000) * 100}%`,
                        background: i === 0 ? '#fafafa' : i === 1 ? '#a1a1aa' : i === 2 ? '#52525b' : '#3f3f46',
                      }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 w-20">
                  <div className="text-xs font-mono font-bold text-foreground">
                    {(provider.tokens / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    ${provider.cost.toFixed(2)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Query Latency Distribution */}
        <div className="bg-card border border-border rounded-lg p-5">
          <SectionHeader
            title="Query Latency Distribution"
            subtitle="Retrieval + Generation breakdown (ms)"
          />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={queryLatencyData} stackOffset="none">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="retrieval" name="Retrieval" stackId="a" fill="#52525b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="generation" name="Generation" stackId="a" fill="#fafafa" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
