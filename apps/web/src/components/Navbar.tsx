'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  GitBranch,
  Bell,
  Settings,
  X,
  Menu,
  Terminal,
  Search,
  Play,
  BookOpen,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface Notification {
  id: string
  type: 'fix_created' | 'run_failed' | 'run_passed'
  title: string
  body: string
  link: string
  read: boolean
  created_at: string
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// // ──────────────────────────────────────────────────────────
// // Command Palette Modal
// // ──────────────────────────────────────────────────────────
// function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
//   const router = useRouter()
//   const [query, setQuery] = useState('')
//   const inputRef = useRef<HTMLInputElement>(null)

//   const commands = [
//     { label: 'Dashboard', icon: BarChart3, action: () => router.push('/'), keywords: 'home' },
//     { label: 'View All Runs', icon: Play, action: () => router.push('/runs'), keywords: 'runs history audit' },
//     { label: 'New Audit', icon: Search, action: () => { router.push('/'); onClose(); setTimeout(() => document.querySelector<HTMLInputElement>('input[type="url"]')?.focus(), 300) }, keywords: 'scan analyze url' },
//     { label: 'Connected Repos', icon: GitBranch, action: () => router.push('/repos'), keywords: 'repositories github' },
//     { label: 'Documentation', icon: BookOpen, action: () => router.push('/docs'), keywords: 'docs help guide' },
//     { label: 'Settings', icon: Settings, action: () => router.push('/settings'), keywords: 'preferences config' },
//   ]

//   const filtered = query.trim()
//     ? commands.filter(
//         (cmd) =>
//           cmd.label.toLowerCase().includes(query.toLowerCase()) ||
//           cmd.keywords.toLowerCase().includes(query.toLowerCase())
//       )
//     : commands

//   useEffect(() => {
//     if (open) {
//       setTimeout(() => inputRef.current?.focus(), 100)
//       setQuery('')
//     }
//   }, [open])

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') onClose()
//       if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
//         e.preventDefault()
//         open ? onClose() : onClose() // toggle handled by parent
//       }
//     }
//     document.addEventListener('keydown', handleKeyDown)
//     return () => document.removeEventListener('keydown', handleKeyDown)
//   }, [open, onClose])

//   if (!open) return null

//   return (
//     <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
//       {/* Backdrop */}
//       <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

//       {/* Modal */}
//       <motion.div
//         initial={{ opacity: 0, scale: 0.95, y: -10 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: 0.95, y: -10 }}
//         transition={{ duration: 0.15 }}
//         className="relative w-full max-w-lg bg-white rounded-2xl border border-[#D0D7DE] shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
//       >
//         {/* Search input */}
//         <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F0F2F5]">
//           <Search className="w-5 h-5 text-[#8B949E]" />
//           <input
//             ref={inputRef}
//             type="text"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Type a command or search..."
//             className="flex-1 text-sm bg-transparent outline-none text-[#1f2937] placeholder-[#8B949E]"
//           />
//           <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-[#8B949E] bg-[#F0F2F5] rounded-md border border-[#D0D7DE]">
//             ESC
//           </kbd>
//         </div>

//         {/* Command list */}
//         <div className="max-h-[320px] overflow-y-auto p-2">
//           {filtered.length === 0 ? (
//             <div className="py-8 text-center">
//               <p className="text-sm text-[#8B949E]">No results found</p>
//             </div>
//           ) : (
//             filtered.map((cmd, i) => (
//               <button
//                 key={cmd.label}
//                 onClick={() => {
//                   cmd.action()
//                   onClose()
//                 }}
//                 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-blue-50 transition-colors"
//               >
//                 <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
//                   <cmd.icon className="w-4 h-4 text-[#2563eb]" />
//                 </div>
//                 <span className="text-sm font-medium text-[#1f2937]">{cmd.label}</span>
//                 {i === 0 && (
//                   <span className="ml-auto text-[10px] text-[#8B949E]">⌘K</span>
//                 )}
//               </button>
//             ))
//           )}
//         </div>

//         {/* Footer */}
//         <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[#F0F2F5] text-[10px] text-[#8B949E]">
//           <span>↑↓ Navigate</span>
//           <span>↵ Select</span>
//           <span>Esc Dismiss</span>
//         </div>
//       </motion.div>
//     </div>
//   )
// }

// ──────────────────────────────────────────────────────────
// Navbar
// ──────────────────────────────────────────────────────────
export function Navbar() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications').then((res) => res.data),
    refetchInterval: 30000,
    staleTime: 10000,
  })

  const notifications = notificationsData || []
  const unreadCount = notifications.filter((n) => !n.read).length

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false)
      }
    }
    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notificationsOpen])

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read')
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'fix_created':
        return { borderColor: '#8250DF', icon: '🔧', label: 'Auto-Fix Created' }
      case 'run_failed':
        return { borderColor: '#CF222E', icon: '❌', label: 'Run Failed' }
      case 'run_passed':
        return { borderColor: '#1A7F37', icon: '✅', label: 'Run Passed' }
      default:
        return { borderColor: '#D0D7DE', icon: '📋', label: 'Notification' }
    }
  }

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Runs', href: '/runs' },
    { label: 'Repos', href: '/repos' },
    { label: 'Docs', href: '/docs' },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 w-full border-b border-blue-100/40 bg-white/60 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <Zap className="w-5 h-5 text-white font-bold" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-[#1f2937] to-[#374151] bg-clip-text text-transparent">
              Orion
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(({ label, href }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'text-[#2563eb] bg-blue-50'
                      : 'text-[#6b7280] hover:text-[#374151] hover:bg-blue-50/50'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={process.env.NEXT_PUBLIC_GITHUB_APP_URL || 'https://github.com/apps/orion-qa/installations/new'}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
          >
            <GitBranch className="w-4 h-4" />
            Connect GitHub
          </a>

          {/* Command Palette
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#6b7280] bg-[#F0F2F5] rounded-md hover:bg-[#E2E8F0] transition-colors"
            aria-label="Command palette (⌘K)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">⌘K</span>
          </button> */}

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-[#6b7280] hover:text-[#374151] hover:bg-blue-50 transition-all"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#CF222E] rounded-full border-2 border-white"
                />
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-[320px] bg-white/90 backdrop-blur-md border border-[#D0D7DE] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F2F5] bg-[#FAFBFC]">
                    <h3 className="font-bold text-sm text-[#1F2328]">Notifications</h3>
                    <button onClick={markAllRead} className="text-xs font-medium text-[#0969DA] hover:underline">
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <Bell className="w-8 h-8 text-[#8B949E] mb-3" />
                        <p className="text-sm font-medium text-[#656D76]">You're all caught up</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const styles = getNotificationStyles(n.type)
                        return (
                          <div
                            key={n.id}
                            className="px-4 py-3 border-b border-[#F0F2F5] hover:bg-[#FAFBFC] cursor-pointer transition-colors flex gap-3 items-start"
                            style={{ borderLeft: `3px solid ${styles.borderColor}` }}
                          >
                            <span className="text-xl mt-0.5 shrink-0">{styles.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <h4 className="text-[13px] font-semibold text-[#1F2328]">{styles.label}</h4>
                                <span className="text-[11px] text-[#8B949E] shrink-0 ml-2">{getRelativeTime(n.created_at)}</span>
                              </div>
                              <p className="text-xs text-[#656D76] line-clamp-2">{n.body}</p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <Link
                      href="/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="block text-center py-3 text-xs font-medium text-[#0969DA] hover:underline border-t border-[#F0F2F5] bg-[#FAFBFC]"
                    >
                      View all notifications
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className="p-2 rounded-lg text-[#6b7280] hover:text-[#374151] hover:bg-blue-50 transition-all"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-blue-50 transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-[#6b7280]" />
            ) : (
              <Menu className="w-5 h-5 text-[#6b7280]" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 right-0 w-64 bg-white/95 backdrop-blur-md border-l border-[#D0D7DE] shadow-xl z-50 lg:hidden"
            >
              <div className="flex flex-col p-6 gap-4 mt-16">
                {navItems.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-[#1f2937] hover:text-[#2563eb] py-2"
                  >
                    {label}
                  </Link>
                ))}
                <hr className="border-[#F0F2F5]" />
                <a
                  href={process.env.NEXT_PUBLIC_GITHUB_APP_URL || 'https://github.com/apps/orion-qa/installations/new'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#2563eb]"
                >
                  Connect GitHub
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Command Palette
      <AnimatePresence>
        {commandPaletteOpen && (
          <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        )}
      </AnimatePresence> */}
    </>
  )
}