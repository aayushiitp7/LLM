'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search, LayoutDashboard, Files, MessageSquare, BarChart3, Settings, Users, ArrowRight } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[20vh] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      
      <Command 
        className="relative z-10 w-full max-w-2xl bg-surface-200/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
        loop
      >
        <div className="flex items-center px-4 border-b border-white/5">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <Command.Input 
            autoFocus
            placeholder="Search documents, chats, or commands... (Cmd + K)" 
            className="flex-1 h-14 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-lg"
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-white/10 bg-surface-100 px-2 text-[10px] font-medium text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto p-2 scroll-py-2">
          <Command.Empty className="py-12 text-center">
            <Search className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No results found.</p>
          </Command.Empty>

          <Command.Group heading="Navigation" className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard'))} className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-sm text-foreground">
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/documents'))} className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-sm text-foreground">
              <Files className="w-4 h-4" />
              <span>Search Documents</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/chat'))} className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-sm text-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>New AI Chat Session</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/analytics'))} className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-sm text-foreground">
              <BarChart3 className="w-4 h-4" />
              <span>View Analytics</span>
            </Command.Item>
          </Command.Group>

          <Command.Separator className="h-px bg-white/5 my-2 mx-2" />

          <Command.Group heading="Settings & Admin" className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Command.Item onSelect={() => runCommand(() => router.push('/admin/users'))} className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-sm text-foreground">
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/admin/settings'))} className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-sm text-foreground">
              <Settings className="w-4 h-4" />
              <span>System Settings</span>
            </Command.Item>
          </Command.Group>
          
          <Command.Separator className="h-px bg-white/5 my-2 mx-2" />
          
          <Command.Group heading="Recent Documents (Semantic Search)" className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
             <Command.Item onSelect={() => runCommand(() => console.log('Doc'))} className="flex justify-between items-center px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-sm text-foreground">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded bg-brand-500/20 flex items-center justify-center text-brand-400">PDF</div>
                 <div>
                    <div className="font-medium">Q3 Financial Report 2026.pdf</div>
                    <div className="text-xs text-muted-foreground">Matches: "revenue projections"</div>
                 </div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </Command.Item>
             <Command.Item onSelect={() => runCommand(() => console.log('Doc'))} className="flex justify-between items-center px-3 py-3 rounded-lg cursor-pointer hover:bg-white/5 aria-selected:bg-primary/10 aria-selected:text-primary transition-colors text-sm text-foreground">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded bg-success/20 flex items-center justify-center text-success">XLSX</div>
                 <div>
                    <div className="font-medium">Employee Roster Global.xlsx</div>
                    <div className="text-xs text-muted-foreground">Matches: "engineering headcount"</div>
                 </div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </Command.Item>
          </Command.Group>

        </Command.List>
      </Command>
    </div>
  )
}
