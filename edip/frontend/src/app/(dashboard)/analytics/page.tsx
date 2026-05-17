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
  { name: 'Contracts', value: 34, color: '#3b5fff' },
  { name: 'Policies', value: 22, color: '#8b5cf6' },
  { name: 'Invoices', value: 18, color: '#0ea5e9' },
  { name: 'Reports', value: 14, color: '#22c55e' },
  { name: 'HR Docs', value: 8, color: '#f59e0b' },
  { name: 'Other', value: 4, color: '#6b7280' },
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
  color,
  subvalue,
}: {
  label: string
  value: string
  unit?: string
  change?: string
  changePositive?: boolean
  icon: React.ElementType
  color: string
  subvalue?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="stats-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              changePositive
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
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
        <div className="text-2xl font-bold font-display text-foreground">
          {value}
          {unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
        </div>
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        {subvalue && (
          <div className="text-[10px] text-muted-foreground">{subvalue}</div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="glass-card rounded-xl px-4 py-3 text-xs"
      style={{ border: '1px solid rgba(59, 95, 255, 0.15)' }}
    >
      <div className="text-muted-foreground mb-2 font-medium">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Risk Heatmap ─────────────────────────────────────────────────────────

function RiskHeatmap() {
  const getIntensity = (value: number, max: number) => {
    const ratio = value / max
    if (ratio === 0) return 'bg-surface-200'
    if (ratio < 0.2) return 'bg-green-900/30'
    if (ratio < 0.4) return 'bg-yellow-900/40'
    if (ratio < 0.6) return 'bg-orange-900/40'
    return 'bg-red-900/50'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left pb-3 text-muted-foreground pr-4">Department</th>
            {['Low', 'Medium', 'High', 'Critical'].map((level) => (
              <th key={level} className="text-center pb-3 text-muted-foreground px-2">
                {level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="space-y-2">
          {riskHeatmapData.map((row, i) => (
            <motion.tr
              key={row.dept}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <td className="py-2 pr-4 font-medium text-foreground">{row.dept}</td>
              {[
                { val: row.low, max: 100 },
                { val: row.medium, max: 60 },
                { val: row.high, max: 25 },
                { val: row.critical, max: 10 },
              ].map((cell, j) => (
                <td key={j} className="py-2 px-2 text-center">
                  <div
                    className={`mx-auto w-12 h-8 rounded-md flex items-center justify-center font-semibold transition-all duration-200 hover:scale-110 cursor-default ${
                      cell.val === 0
                        ? 'bg-surface-200 text-muted-foreground'
                        : j === 0
                        ? 'bg-green-900/30 text-green-400'
                        : j === 1
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : j === 2
                        ? 'bg-orange-900/40 text-orange-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                    title={`${cell.val} documents`}
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
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ─── Main Analytics Dashboard ─────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time platform metrics and AI quality indicators
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                timeRange === range
                  ? 'bg-brand-600 text-white shadow-glow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Documents Processed"
          value="24,891"
          change="+12.3%"
          changePositive
          icon={FileText}
          color="#3b5fff"
          subvalue="vs. last period"
        />
        <MetricCard
          label="AI Queries Today"
          value="1,247"
          change="+8.7%"
          changePositive
          icon={MessageSquare}
          color="#8b5cf6"
          subvalue="Avg 4 per active user"
        />
        <MetricCard
          label="Avg Retrieval Time"
          value="487"
          unit="ms"
          change="-15.2%"
          changePositive
          icon={Clock}
          color="#22c55e"
          subvalue="P95: 920ms"
        />
        <MetricCard
          label="RAG Faithfulness"
          value="94.3%"
          change="+2.1%"
          changePositive
          icon={Shield}
          color="#f59e0b"
          subvalue="Hallucination rate: 2.1%"
        />
      </div>

      {/* Row 2: Upload Volume + RAG Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upload Volume Chart */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeader
            title="Document Processing Volume"
            subtitle="Uploads → OCR → Indexed pipeline"
          />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={uploadVolumeData}>
              <defs>
                <linearGradient id="uploadsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b5fff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b5fff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="indexedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="uploads"
                name="Uploads"
                stroke="#3b5fff"
                strokeWidth={2}
                fill="url(#uploadsGrad)"
              />
              <Area
                type="monotone"
                dataKey="indexed"
                name="Indexed"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#indexedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* RAG Quality Metrics */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeader
            title="RAG Quality Metrics"
            subtitle="Weekly faithfulness, relevancy, and precision"
          />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ragQualityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#6b7280' }}
                axisLine={false}
                domain={[0.7, 1.0]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              />
              <Tooltip
                content={<CustomTooltip />}
                formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
              />
              <Legend iconType="circle" iconSize={6} />
              <Line
                type="monotone"
                dataKey="faithfulness"
                name="Faithfulness"
                stroke="#3b5fff"
                strokeWidth={2}
                dot={{ fill: '#3b5fff', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="relevancy"
                name="Relevancy"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="precision"
                name="Precision"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Risk Heatmap + Document Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Risk Heatmap */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <SectionHeader
            title="Risk Distribution Heatmap"
            subtitle="Document risk levels by department"
          />
          <RiskHeatmap />
        </div>

        {/* Document Type Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeader
            title="Document Types"
            subtitle="By category"
          />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={documentTypeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {documentTypeData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) =>
                  payload?.[0] ? (
                    <div className="glass-card rounded-lg px-3 py-2 text-xs">
                      <span className="text-foreground font-semibold">{payload[0].name}:</span>
                      <span className="text-muted-foreground ml-1">{payload[0].value}%</span>
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2 mt-2">
            {documentTypeData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-foreground font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Token Usage + Latency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LLM Token Usage */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeader
            title="LLM Token Usage & Cost"
            subtitle="By provider this month"
          />
          <div className="space-y-3">
            {tokenUsageData.map((provider, i) => (
              <motion.div
                key={provider.provider}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-24 text-xs font-medium text-foreground flex-shrink-0">
                  {provider.provider}
                </div>
                <div className="flex-1">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${(provider.tokens / 4200000) * 100}%`,
                        background: i === 0 ? '#3b5fff' : i === 1 ? '#8b5cf6' : i === 2 ? '#0ea5e9' : '#22c55e',
                      }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-semibold text-foreground">
                    {(provider.tokens / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ${provider.cost.toFixed(2)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Query Latency Distribution */}
        <div className="glass-card rounded-2xl p-6">
          <SectionHeader
            title="Query Latency Distribution"
            subtitle="Retrieval + Generation breakdown (ms)"
          />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={queryLatencyData} stackOffset="none">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="retrieval" name="Retrieval" stackId="a" fill="#3b5fff" radius={[0, 0, 0, 0]} />
              <Bar dataKey="generation" name="Generation" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
