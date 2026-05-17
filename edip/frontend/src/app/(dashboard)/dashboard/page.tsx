'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts'
import { 
  Activity, ArrowUpRight, ArrowDownRight, 
  Files, Users, BrainCircuit, Clock 
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

const COLORS = ['#fafafa', '#a1a1aa', '#52525b', '#27272a'] // Monochrome strict

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
    transition: { staggerChildren: 0.05 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'tween', duration: 0.2 } }
}

export default function DashboardPage() {
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
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform metrics and operational intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">Export Data</button>
          <button className="btn-primary">New Query</button>
        </div>
      </motion.div>

      {/* Top Metrics Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Documents', value: '124,592', change: '+12.5%', isUp: true, icon: Files },
          { label: 'AI Queries (7d)', value: '32.4k', change: '+24.1%', isUp: true, icon: BrainCircuit },
          { label: 'Active Users', value: '1,429', change: '-2.4%', isUp: false, icon: Users },
          { label: 'Avg Processing Time', value: '0.4s', change: '-12%', isUp: true, icon: Clock },
        ].map((stat, i) => (
          <motion.div key={i} variants={item} className="premium-card p-5 group cursor-default">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold text-foreground tracking-tight">{stat.value}</span>
              <span className={`flex items-center text-xs font-medium ${stat.isUp ? 'text-success' : 'text-danger'}`}>
                {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
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
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Main Area Chart */}
        <motion.div variants={item} className="premium-card p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Usage Analytics</h2>
            </div>
            <select className="bg-background border border-border text-xs rounded-md px-2 py-1 outline-none focus:border-ring cursor-pointer">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '12px' }}
                  itemStyle={{ color: '#fafafa' }}
                />
                <Area type="monotone" dataKey="queries" stroke="#fafafa" strokeWidth={1.5} fillOpacity={0.1} fill="#fafafa" />
                <Area type="monotone" dataKey="documents" stroke="#52525b" strokeWidth={1.5} fillOpacity={0.1} fill="#52525b" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={item} className="premium-card p-5 flex flex-col">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground">Distribution</h2>
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
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
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
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">System Log</h2>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live Sync
          </div>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="px-5 py-3 flex items-center gap-4 hover:bg-secondary/50 transition-colors cursor-pointer group">
              <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center shrink-0">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.target}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</p>
                  <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground">
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
