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
  Globe,
  Check,
  Loader2,
  ExternalLink,
  ChevronRight,
  AlertCircle,
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

// ──────────────────────────────────────────────────────────
// Register Repo Modal
// ──────────────────────────────────────────────────────────
function RegisterRepoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [repoName, setRepoName] = useState('')
  const [repoOwner, setRepoOwner] = useState('')
  const [stagingUrl, setStagingUrl] = useState('')
  const [passThreshold, setPassThreshold] = useState(70)
  const [autoFix, setAutoFix] = useState(true)
  const [ignoredPaths, setIgnoredPaths] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [installationId, setInstallationId] = useState<string | null>(null)

  const githubAppUrl = process.env.NEXT_PUBLIC_GITHUB_APP_URL || 'https://github.com/apps/orion-qa-agent/installations/new'

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1)
      setRepoName('')
      setRepoOwner('')
      setStagingUrl('')
      setPassThreshold(70)
      setAutoFix(true)
      setIgnoredPaths('')
      setIsLoading(false)
      setIsSaving(false)
      setErrorMessage(null)
      setInstallationId(null)
    }
  }, [open])

  // Step 1: Prompt user to install GitHub App
  const handleInstallOnGitHub = () => {
    window.open(githubAppUrl, '_blank')
  }

  // Step 2: Handle manual repo registration
  const handleManualRegister = () => {
    setStep(2)
  }

  // Step 3: Save configuration
  const handleSave = async () => {
    if (!stagingUrl.trim()) {
      setErrorMessage('Staging URL is required.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)

      await api.post('/repos', {
        owner: repoOwner,
        repo: repoName,
        installationId: installationId || 'manual',
        stagingUrl: stagingUrl.trim(),
        passThreshold,
        autoFixEnabled: autoFix,
        ignoredPaths: ignoredPaths.trim() || undefined,
      })

      setStep(3)
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to register repository. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-[520px] bg-white rounded-3xl border border-[#F0F2F5] shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-8 overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-[#8B949E] hover:text-[#1F2328] hover:bg-[#F0F2F5] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Choose Installation Method ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-[#F0F6FC] text-[#0969DA] flex items-center justify-center border-4 border-[#C2DBF5] mb-6">
                <GitBranch size={32} />
              </div>
              <h2 className="bricolage font-extrabold text-2xl text-[#1F2328] tracking-tight mb-3">
                Register a Repository
              </h2>
              <p className="text-sm text-[#656D76] mb-8 max-w-[360px]">
                Connect your GitHub repository to enable automatic PR audits and self-healing fixes.
              </p>

              <div className="flex flex-col gap-3 w-full">
                {/* Install via GitHub App */}
                <button
                  onClick={handleInstallOnGitHub}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#0969DA] text-white font-semibold text-sm hover:bg-[#0558B7] transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Install GitHub App</p>
                    <p className="text-xs text-white/70 mt-0.5">Auto-sync repos with one click</p>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Manual Registration */}
                <button
                  onClick={handleManualRegister}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-[#D0D7DE] bg-white text-[#1F2328] font-semibold text-sm hover:bg-[#F0F2F5] transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F0F2F5] flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-[#656D76]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Manual Registration</p>
                    <p className="text-xs text-[#656D76] mt-0.5">Enter repo details yourself</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 text-[#8B949E] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Manual Registration Form ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#F0F6FC] text-[#0969DA] flex items-center justify-center border-4 border-[#C2DBF5] mb-4">
                  <Settings size={30} />
                </div>
                <h2 className="bricolage font-extrabold text-[26px] text-[#1F2328] tracking-tight mb-2">
                  Register Repository
                </h2>
                <p className="text-sm text-[#656D76]">
                  Enter your repository details and configuration.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-[#FFEBE9] border border-[#FFCCC9] flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#CF222E] shrink-0" />
                  <p className="text-sm text-[#CF222E]">{errorMessage}</p>
                </div>
              )}

              <div className="space-y-5">
                {/* Repo Owner + Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                      Owner <span className="text-[#CF222E]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mohfazam"
                      value={repoOwner}
                      onChange={(e) => setRepoOwner(e.target.value)}
                      className="w-full h-[46px] px-3.5 text-sm text-[#1F2328] bg-white border border-[#D0D7DE] rounded-xl outline-none focus:border-[#0969DA] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.14)] transition-all placeholder:text-[#8B949E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                      Repository <span className="text-[#CF222E]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FOODZY"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      className="w-full h-[46px] px-3.5 text-sm text-[#1F2328] bg-white border border-[#D0D7DE] rounded-xl outline-none focus:border-[#0969DA] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.14)] transition-all placeholder:text-[#8B949E]"
                    />
                  </div>
                </div>

                {/* Staging URL */}
                <div>
                  <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                    Staging URL <span className="text-[#CF222E]">*</span>
                  </label>
                  <div className="relative">
                    <Globe size={15} className="absolute top-1/2 -translate-y-1/2 left-3.5 text-[#8B949E] pointer-events-none" />
                    <input
                      type="url"
                      placeholder="https://foodzy-delta.vercel.app"
                      value={stagingUrl}
                      onChange={(e) => setStagingUrl(e.target.value)}
                      className="w-full h-[46px] pl-[38px] pr-3.5 text-sm text-[#1F2328] font-mono bg-white border border-[#D0D7DE] rounded-xl outline-none focus:border-[#0969DA] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.14)] transition-all placeholder:text-[#8B949E]"
                    />
                  </div>
                </div>

                {/* Pass Threshold */}
                <div>
                  <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                    Pass Threshold: <span className="text-[#0969DA]">{passThreshold}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={passThreshold}
                    onChange={(e) => setPassThreshold(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#D0D7DE] rounded-lg appearance-none cursor-pointer accent-[#0969DA]"
                  />
                  <p className="text-xs text-[#656D76] mt-1.5">Quality score must be at least {passThreshold}% to pass</p>
                </div>

                {/* Auto-Fix Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D0D7DE]">
                  <span className="text-[13px] font-semibold text-[#1F2328]">Enable Auto-Fix PRs</span>
                  <button
                    type="button"
                    onClick={() => setAutoFix(!autoFix)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${autoFix ? 'bg-[#1A7F37]' : 'bg-[#D0D7DE]'}`}
                  >
                    <motion.div
                      animate={{ x: autoFix ? 24 : 2 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"
                    />
                  </button>
                </div>

                {/* Ignored Paths */}
                <div>
                  <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                    Ignored Paths (optional)
                  </label>
                  <textarea
                    placeholder="dist, node_modules, .next"
                    value={ignoredPaths}
                    onChange={(e) => setIgnoredPaths(e.target.value)}
                    className="w-full h-[80px] p-3.5 text-sm text-[#1F2328] font-mono bg-white border border-[#D0D7DE] rounded-xl outline-none focus:border-[#0969DA] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.14)] transition-all placeholder:text-[#8B949E] resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !stagingUrl.trim() || !repoOwner.trim() || !repoName.trim()}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-[#0969DA] text-white font-bold text-sm rounded-xl hover:bg-[#0558B7] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_2px_12px_rgba(9,105,218,0.28)]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save & Activate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11.5px] text-[#8B949E] text-center font-medium hover:text-[#656D76] transition-colors"
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center py-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-[#E6F4EA] text-[#1A7F37] flex items-center justify-center border-[5px] border-[#A7F3D0] mb-6"
              >
                <Check size={36} />
              </motion.div>

              <h2 className="bricolage font-extrabold text-[28px] text-[#1F2328] tracking-tight mb-2">
                Orion is now watching your repo
              </h2>
              <p className="text-sm text-[#656D76] mb-8 max-w-[360px]">
                Every PR will be automatically audited for quality regressions. You'll get instant feedback and suggested fixes.
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => {
                    onClose()
                    router.push('/repos')
                  }}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-[#0969DA] text-white font-bold text-sm rounded-xl hover:bg-[#0558B7] transition-colors"
                >
                  <GitBranch size={16} />
                  View Repositories
                </button>
                <button
                  onClick={onClose}
                  className="text-[11.5px] text-[#8B949E] text-center font-medium hover:text-[#656D76] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Navbar
// ──────────────────────────────────────────────────────────
export function Navbar() {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [registerRepoOpen, setRegisterRepoOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications')
        if (res && res.data && Array.isArray(res.data)) {
          return res.data as Notification[];
        }
        return [];
      } catch {
        return [];
      }
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
          {/* Register Repo Button */}
          <button
            onClick={() => setRegisterRepoOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
          >
            <GitBranch className="w-4 h-4" />
            Register Repo
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
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setRegisterRepoOpen(true)
                  }}
                  className="text-sm font-semibold text-[#2563eb] text-left"
                >
                  Register Repo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Register Repo Modal */}
      <AnimatePresence>
        {registerRepoOpen && (
          <RegisterRepoModal open={registerRepoOpen} onClose={() => setRegisterRepoOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}