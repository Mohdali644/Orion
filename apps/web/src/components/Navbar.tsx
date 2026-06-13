'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, GitBranch, Bell, Settings, Terminal, X } from 'lucide-react'
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

export function Navbar() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications')
      return res.data as Notification[]
    },
    refetchInterval: 30000,
    staleTime: 10000,
  })

  const notifications = notificationsData || []
  const unreadCount = notifications.filter((n) => !n.read).length

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

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read')
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'fix_created':
        return { borderColor: '#8250DF', icon: '🔧', iconColor: '#8250DF', label: 'Auto-Fix Created' }
      case 'run_failed':
        return { borderColor: '#CF222E', icon: '❌', iconColor: '#CF222E', label: 'Run Failed' }
      case 'run_passed':
        return { borderColor: '#1A7F37', icon: '✅', iconColor: '#1A7F37', label: 'Run Passed' }
      default:
        return { borderColor: '#D0D7DE', icon: '📋', iconColor: '#656D76', label: 'Notification' }
    }
  }

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Runs', href: '/runs' },
    { label: 'Repos', href: '/repos' },
    { label: 'Docs', href: '/docs' },
  ]

  return (
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

        {/* Icon buttons */}
        <div className="flex items-center gap-1">
          {/* Command palette */}
          <button className="p-2 rounded-lg text-[#6b7280] hover:text-[#374151] hover:bg-blue-50 transition-all" aria-label="Command palette">
            <Terminal className="w-5 h-5" />
          </button>

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
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F2F5] bg-[#FAFBFC]">
                    <h3 className="font-bold text-sm text-[#1F2328]">Notifications</h3>
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium text-[#0969DA] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>

                  {/* List */}
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
        </div>

        {/* Mobile menu */}
        <button className="lg:hidden p-2 rounded-lg hover:bg-blue-50 transition-all">
          <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  )
}