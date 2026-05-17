'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, MessageSquare, AlertTriangle, Clock, 
  TrendingUp, ArrowRight, ShieldCheck, Zap
} from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts'

const activityData = [
  { time: '08:00', queries: 12 },
  { time: '10:00', queries: 45 },
  { time: '12:00', queries: 32 },
  { time: '14:00', queries: 68 },
  { time: '16:00', queries: 85 },
  { time: '18:00', queries: 41 },
  { time: '20:00', queries: 15 },
]

export default function DashboardOverview() {
  return (
    <div className="p-6 max-w-7xl mx-auto h-full space-y-8">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-brand-400 mb-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">Enterprise Secure Mode</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold font-display text-foreground"
          >
            Welcome back, John.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-1"
          >
            Here is what's happening across your document intelligence platform today.
          </motion.p>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <Link href="/documents" className="btn-ghost glass-card">
            <FileText className="w-4 h-4 mr-2 inline" />
            Upload
          </Link>
          <Link href="/chat" className="btn-primary flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            New Chat
          </Link>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stats-card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-400" />
            </div>
            <span className="badge-green">+12 today</span>
          </div>
          <div className="text-2xl font-bold text-foreground">24,891</div>
          <div className="text-sm text-muted-foreground">Total Documents</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stats-card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <span className="badge-green">+85 today</span>
          </div>
          <div className="text-2xl font-bold text-foreground">1,247</div>
          <div className="text-sm text-muted-foreground">AI Queries</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stats-card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-success text-xs font-bold">+2.1%</span>
          </div>
          <div className="text-2xl font-bold text-foreground">94.3%</div>
          <div className="text-sm text-muted-foreground">RAG Faithfulness</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="stats-card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <span className="badge-red">Requires Action</span>
          </div>
          <div className="text-2xl font-bold text-foreground">3</div>
          <div className="text-sm text-muted-foreground">Compliance Risks</div>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-foreground">Platform Activity (Today)</h3>
            <button className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View Analytics <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b5fff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b5fff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 17, 32, 0.9)', border: '1px solid rgba(59,95,255,0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="queries" stroke="#3b5fff" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-foreground">Risk Alerts</h3>
            <span className="badge-red">3 New</span>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black/20 border border-white/5 hover:border-orange-500/30 transition-colors cursor-pointer">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Missing Indemnification</div>
                  <div className="text-xs text-muted-foreground mt-1">Vendor Contract - TechFlow.pdf deviates from standard policy.</div>
                  <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 2 hours ago
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 rounded-xl bg-black/20 border border-white/5 hover:border-red-500/30 transition-colors cursor-pointer">
              <div className="flex gap-3">
                <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">PII Exposure Detected</div>
                  <div className="text-xs text-muted-foreground mt-1">Found unmasked SSN in HR Onboarding file. Automatic mask applied.</div>
                  <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 5 hours ago
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShieldAlert(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 22-5.5-3.5L5 6l7-4 7 4-1.5 12.5L12 22" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}
