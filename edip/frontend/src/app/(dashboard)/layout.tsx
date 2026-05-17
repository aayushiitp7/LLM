'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Files, 
  MessageSquare, 
  Search, 
  BarChart3, 
  Settings, 
  Users, 
  LogOut,
  Bell,
  Menu,
  X,
  FileText
} from 'lucide-react'
import { CommandPalette } from '@/components/command-palette'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: Files },
  { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

const adminNavigation = [
  { name: 'Users & Roles', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-300 flex">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-surface-200 border-r border-white/5">
        
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b5fff 0%, #8b5cf6 100%)' }}>
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold font-display text-foreground">
              DocIntel <span className="text-brand-400">Enterprise</span>
            </span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">John Doe</div>
              <div className="text-xs text-muted-foreground truncate">john@enterprise.com</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Platform
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-muted-foreground'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
              Administration
            </div>
            <nav className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-muted-foreground'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5">
          <button className="sidebar-link w-full text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 h-screen">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/5 bg-surface-300/80 backdrop-blur-xl z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden md:flex items-center text-sm text-muted-foreground bg-surface-200 border border-white/5 rounded-md px-3 py-1.5 cursor-pointer hover:bg-surface-100 transition-colors"
                 onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
              <Search className="w-4 h-4 mr-2 opacity-50" />
              <span>Search everything...</span>
              <div className="ml-8 flex items-center gap-1 opacity-50 font-mono text-[10px]">
                <span className="px-1 border border-white/10 rounded">⌘</span>
                <span className="px-1 border border-white/10 rounded">K</span>
              </div>
            </div>
            
            {/* Breadcrumb / Status */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                System Operational
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-foreground hover:text-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border border-surface-300" />
            </button>
          </div>
        </header>

        {/* Page Content with Framer Motion Page Transitions */}
        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette Component */}
      <CommandPalette />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-64 bg-surface-200 border-r border-white/5 z-50 flex flex-col md:hidden"
          >
              {/* Duplicate sidebar content for mobile */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                <span className="text-sm font-bold text-foreground">DocIntel</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-8">
                <nav className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
