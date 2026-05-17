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
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-popover border-r border-border shadow-subtle">
        
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border bg-card">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center bg-primary rounded">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              DocIntel
            </span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-foreground font-semibold text-xs border border-border">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">John Doe</div>
              <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Enterprise Admin</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Platform
            </div>
            <nav className="space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3">
              Administration
            </div>
            <nav className="space-y-0.5">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border">
          <button className="sidebar-link w-full text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 h-screen bg-background">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card z-40 sticky top-0 shadow-subtle">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden md:flex items-center text-sm text-muted-foreground bg-secondary border border-border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors shadow-sm"
                 onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
              <Search className="w-4 h-4 mr-2" />
              <span>Search platform...</span>
              <div className="ml-8 flex items-center gap-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 border border-border rounded bg-background">⌘</span>
                <span className="px-1.5 py-0.5 border border-border rounded bg-background">K</span>
              </div>
            </div>
            
            {/* Breadcrumb / Status */}
            <div className="hidden sm:flex items-center gap-2 text-sm ml-4">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-success text-[10px] font-bold uppercase tracking-wider bg-success/10">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Operational
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-foreground hover:text-foreground relative rounded hover:bg-secondary transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content with Framer Motion Page Transitions */}
        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
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
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-background/80 z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        {isMobileMenuOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="fixed inset-y-0 left-0 w-64 bg-popover border-r border-border z-50 flex flex-col md:hidden shadow-modal"
          >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <span className="text-sm font-semibold text-foreground">DocIntel</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <nav className="space-y-0.5">
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
