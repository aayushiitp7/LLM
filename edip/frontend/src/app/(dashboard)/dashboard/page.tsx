'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts'
import { 
  Activity, ArrowUpRight, ArrowDownRight, 
  Files, Users, BrainCircuit, Clock, CheckCircle2 
} from 'lucide-react'

// --- Mock Data ---
const usageData = [
  { name: 'Mon', queries: 4000, documents: 2400 },
  { name: 'Tue', queries: 3000, documents: 1398 },
  { name: 'Wed', queries: 2000, documents: 9800 },
  { name: 'Thu', queries: 2780, documents: 3908 },
  { name: 'Fri', queries: 1890, documents: 4800 },
  { name: 'Sat', queries: 2390, documents: 3800 },
  { name: 'Sun', queries: 3490, documents: 4300 },
]

const pieData = [
  { name: 'Financial', value: 400 },
  { name: 'Legal', value: 300 },
  { name: 'HR', value: 300 },
  { name: 'Technical', value: 200 },
]

const COLORS = ['#3b5fff', '#8b5cf6', '#10b981', '#f59e0b']

const recentActivity = [
  { id: 1, action: 'Document Indexed', target: 'Q3_Financial_Report.pdf', time: '2m ago', user: 'System' },
  { id: 2, action: 'Query Executed', target: 'Semantic Search: "Revenue projections"', time: '15m ago', user: 'Alice Chen' },
  { id: 3, action: 'User Invited', target: 'robert.smith@enterprise.com', time: '1h ago', user: 'Admin' },
  { id: 4, action: 'Model Updated', target: 'GPT-4o fine-tuning complete', time: '2h ago', user: 'System' },
]

// --- Animation Variants ---
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
}

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Platform metrics and AI intelligence activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">Export Report</button>
          <button className="btn-primary">New Query</button>
        </div>
      </motion.div>

      {/* Top Metrics Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: 'Total Documents', value: '124,592', change: '+12.5%', isUp: true, icon: Files, color: 'text-brand-400' },
          { label: 'AI Queries (7d)', value: '32.4k', change: '+24.1%', isUp: true, icon: BrainCircuit, color: 'text-purple-400' },
          { label: 'Active Users', value: '1,429', change: '-2.4%', isUp: false, icon: Users, color: 'text-emerald-400' },
          { label: 'Avg Processing Time', value: '0.4s', change: '-12%', isUp: true, icon: Clock, color: 'text-amber-400' },
        ].map((stat, i) => (
          <motion.div key={i} variants={item} className="premium-card p-6 group cursor-default">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="mt-4 flex items-baseline gap-4">
              <span className="text-3xl font-display font-bold text-foreground">{stat.value}</span>
              <span className={`flex items-center text-sm font-medium ${stat.isUp ? 'text-success' : 'text-destructive'}`}>
                {stat.isUp ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Main Area Chart */}
        <motion.div variants={item} className="premium-card p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Usage Analytics</h2>
              <p className="text-sm text-muted-foreground">Queries vs Document Processing</p>
            </div>
            <select className="bg-surface-100 border border-white/10 text-sm rounded-md px-3 py-1.5 outline-none focus:border-brand-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b5fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b5fff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141627', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="queries" stroke="#3b5fff" strokeWidth={2} fillOpacity={1} fill="url(#colorQueries)" />
                <Area type="monotone" dataKey="documents" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorDocs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={item} className="premium-card p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Document Categories</h2>
            <p className="text-sm text-muted-foreground">Distribution by department</p>
          </div>
          <div className="flex-1 flex flex-col justify-center relative min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141627', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Activity Stream */}
      <motion.div 
        variants={item}
        initial="hidden"
        animate="show"
        className="premium-card overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Live Activity Stream</h2>
            <p className="text-sm text-muted-foreground">Real-time system events</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-brand-400 font-medium px-2 py-1 bg-brand-500/10 rounded-full border border-brand-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Live
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-surface-100 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground truncate">{activity.target}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-md bg-surface-100 text-muted-foreground border border-white/5">
                    {activity.user}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
