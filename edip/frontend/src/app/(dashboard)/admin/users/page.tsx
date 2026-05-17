'use client'

import { useState } from 'react'
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
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage RBAC, roles, and security policies.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="input-primary pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="glass-card px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden flex-1 border border-white/5">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Department</th>
              <th>Security</th>
              <th>Status</th>
              <th>Last Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="group">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.role === 'Tenant Admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'badge-gray'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="text-muted-foreground">{user.department}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    {user.mfa ? (
                      <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> MFA Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  {user.status === 'Active' ? (
                    <span className="status-online ml-4" />
                  ) : (
                    <span className="status-offline ml-4" />
                  )}
                </td>
                <td className="text-muted-foreground">{user.lastLogin}</td>
                <td className="text-right">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
