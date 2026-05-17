'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Filter, ShieldCheck, Mail, MoreHorizontal, Plus } from 'lucide-react'

const MOCK_USERS = [
  { id: '1', name: 'John Doe', email: 'john@enterprise.com', role: 'Tenant Admin', department: 'IT', status: 'Active', mfa: true, lastLogin: '2 mins ago' },
  { id: '2', name: 'Sarah Smith', email: 'sarah.s@enterprise.com', role: 'Analyst', department: 'Legal', status: 'Active', mfa: true, lastLogin: '1 hour ago' },
  { id: '3', name: 'Mike Johnson', email: 'mike.j@enterprise.com', role: 'Document Manager', department: 'Finance', status: 'Inactive', mfa: false, lastLogin: '3 days ago' },
  { id: '4', name: 'Emily Davis', email: 'emily.d@enterprise.com', role: 'Viewer', department: 'HR', status: 'Active', mfa: true, lastLogin: '5 hours ago' },
  { id: '5', name: 'Service Account', email: 'api-svc-1@enterprise.com', role: 'API Client', department: 'Engineering', status: 'Active', mfa: false, lastLogin: 'Just now' },
]

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col space-y-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage RBAC, roles, and security policies.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-ring transition-colors shadow-subtle"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-card border border-border rounded-lg overflow-hidden flex-1 shadow-subtle"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-secondary/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider border-b border-border">
              <tr>
                <th scope="col" className="px-5 py-3">User</th>
                <th scope="col" className="px-5 py-3">Role</th>
                <th scope="col" className="px-5 py-3">Department</th>
                <th scope="col" className="px-5 py-3">Security</th>
                <th scope="col" className="px-5 py-3 text-center">Status</th>
                <th scope="col" className="px-5 py-3">Last Login</th>
                <th scope="col" className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center text-foreground text-xs font-bold shrink-0">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{user.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-muted-foreground">{user.department}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {user.mfa ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-success bg-success/10 border border-success/20 px-1.5 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3" /> MFA Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded">
                          Disabled
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-success' : 'bg-muted-foreground'}`} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{user.lastLogin}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-3 border-t border-border flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/30">
          <span>Showing 1 to 5 of 5 entries</span>
          <div className="flex gap-1">
            <button className="px-2.5 py-1 rounded border border-border bg-background opacity-50 cursor-not-allowed">Prev</button>
            <button className="px-2.5 py-1 rounded border border-border bg-background hover:bg-secondary transition-colors">Next</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
