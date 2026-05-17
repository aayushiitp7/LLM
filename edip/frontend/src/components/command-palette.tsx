'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Search, LayoutDashboard, Files, MessageSquare, BarChart3, Settings, Users, ArrowRight, FileText } from 'lucide-react'

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pt-[20vh] bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      
      <Command 
        className="relative z-10 w-full max-w-2xl bg-popover rounded-lg shadow-modal border border-border overflow-hidden"
        loop
      >
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <Command.Input 
            autoFocus
            placeholder="Type a command or search... (Cmd + K)" 
            className="flex-1 h-14 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded bg-background border border-border px-1.5 text-[10px] font-bold text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto p-2 scroll-py-2">
          <Command.Empty className="py-12 text-center">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">No results found.</p>
          </Command.Empty>

          <Command.Group heading="Navigation" className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard'))} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-secondary aria-selected:bg-secondary transition-colors text-sm text-foreground">
              <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
              <span>Go to Dashboard</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/documents'))} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-secondary aria-selected:bg-secondary transition-colors text-sm text-foreground">
              <Files className="w-4 h-4 text-muted-foreground" />
              <span>Search Documents</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/chat'))} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-secondary aria-selected:bg-secondary transition-colors text-sm text-foreground">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span>New AI Chat Session</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/analytics'))} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-secondary aria-selected:bg-secondary transition-colors text-sm text-foreground">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span>View Analytics</span>
            </Command.Item>
          </Command.Group>

          <Command.Separator className="h-px bg-border my-2 mx-2" />

          <Command.Group heading="Settings & Admin" className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Command.Item onSelect={() => runCommand(() => router.push('/admin/users'))} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-secondary aria-selected:bg-secondary transition-colors text-sm text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Manage Users</span>
            </Command.Item>
            <Command.Item onSelect={() => runCommand(() => router.push('/admin/settings'))} className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-secondary aria-selected:bg-secondary transition-colors text-sm text-foreground">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span>System Settings</span>
            </Command.Item>
          </Command.Group>
          
          <Command.Separator className="h-px bg-border my-2 mx-2" />
          
          <Command.Group heading="Recent Documents" className="px-2 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
             <Command.Item onSelect={() => runCommand(() => console.log('Doc'))} className="flex justify-between items-center px-3 py-2.5 rounded-md cursor-pointer hover:bg-secondary aria-selected:bg-secondary transition-colors text-sm text-foreground group">
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center">
                   <FileText className="w-3.5 h-3.5 text-foreground" />
                 </div>
                 <div>
                    <div className="text-xs font-medium">Q3 Financial Report 2026.pdf</div>
                 </div>
              </div>
              <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Command.Item>
          </Command.Group>

        </Command.List>
      </Command>
    </div>
  )
}
