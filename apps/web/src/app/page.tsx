"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Crosshair,
  Bell,
  Command,
  GitBranch,
  Menu,
  Play,
  Globe,
  Zap,
  Check,
  X,
  TrendingUp,
  BarChart3,
  Target,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Search,
  XCircle,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Sparkles,
  Terminal,
  Settings,
  FileText,
  PlusSquare,
  Code,
  ExternalLink,
} from "lucide-react"
import { runsApi, reposApi } from "@/lib/api"
import { cn, formatDate, formatDuration, getScoreLabel, getScoreColor, getStatusColor } from "@/lib/utils"
import type { Run, ConnectedRepo } from "@/lib/types"
import { Navbar } from '../components/Navbar'

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function scoreClassToHex(colorClass: string): string {
  if (colorClass.includes("green") || colorClass.includes("emerald")) return "#10b981"
  if (colorClass.includes("amber") || colorClass.includes("yellow")) return "#f59e0b"
  if (colorClass.includes("red")) return "#ef4444"
  return "#ef4444"
}

function getRunDisplayName(run: Run): string {
  if (!run.url) return "Untitled Run"
  try {
    const url = new URL(run.url)
    return url.pathname.replace(/\/$/, "") || url.hostname
  } catch {
    return run.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
  }
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// ──────────────────────────────────────────────────────────
// ScoreArc
// ──────────────────────────────────────────────────────────
function ScoreArc({ score, size = 120, animate = true }: { score: number; size?: number; animate?: boolean }) {
  const center = size / 2
  const radius = center - 10
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(score, 0), 100)
  const arcLength = (clamped / 100) * circumference
  const colorClass = getScoreColor(score)
  const colorHex = scoreClassToHex(colorClass)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Score: ${score} out of 100`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
        <motion.circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={colorHex} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: circumference - arcLength }}
          animate={{ strokeDashoffset: circumference - arcLength }}
          transition={animate ? { type: "spring", stiffness: 80, damping: 14 } : { duration: 0 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="bricolage font-bold text-[24px] leading-none" style={{ color: colorHex }}>{score}</span>
        <span className="text-[11px] text-[#8B949E] mt-0.5">/100</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// MiniScoreRing
// ──────────────────────────────────────────────────────────
function MiniScoreRing({ score }: { score: number }) {
  const size = 28
  const center = size / 2
  const radius = center - 4
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(score, 0), 100)
  const arcLength = (clamped / 100) * circumference
  const colorHex = scoreClassToHex(getScoreColor(score))

  return (
    <div className="inline-flex items-center gap-2">
      <svg width={size} height={size} className="-rotate-90 shrink-0" role="img" aria-label={`Score: ${score}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="10" />
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={colorHex} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - arcLength}
        />
      </svg>
      <span className="bricolage font-bold text-sm" style={{ color: colorHex }}>{score}</span>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// StatCard
// ──────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, accent, children, donut,
}: {
  label: string
  value: string | number
  icon: any
  accent: string
  children?: React.ReactNode
  donut?: { score: number }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300 flex flex-col bg-white/60 border border-blue-100/40 backdrop-blur-md hover:bg-white/80 hover:border-blue-200/60 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest">{label}</h3>
        <Icon className="w-5 h-5 text-[#2563eb]" />
      </div>
      {children ? (
        children
      ) : donut ? (
        <div className="flex items-end justify-between mt-2 relative z-10">
          <span className="bricolage font-bold text-4xl bg-gradient-to-r from-[#1f2937] to-[#374151] bg-clip-text text-transparent">{value}</span>
          <MiniDonut score={donut.score} />
        </div>
      ) : (
        <span className="bricolage font-bold text-4xl bg-gradient-to-r from-[#1f2937] to-[#374151] bg-clip-text text-transparent mt-2 relative z-10">{value}</span>
      )}
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────
// MiniDonut
// ──────────────────────────────────────────────────────────
function MiniDonut({ score }: { score: number }) {
  const size = 48
  const center = size / 2
  const radius = center - 6
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(score, 0), 100)
  const arcLength = (clamped / 100) * circumference
  const colorHex = scoreClassToHex(getScoreColor(score))

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="10" />
      <motion.circle
        cx={center} cy={center} r={radius}
        fill="none" stroke={colorHex} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - arcLength }}
        transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.2 }}
      />
    </svg>
  )
}

// ──────────────────────────────────────────────────────────
// Footer
// ──────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-auto border-t border-blue-100/40 bg-white/40 backdrop-blur-sm py-10">
      <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-8 max-w-7xl mx-auto gap-6">
        <div className="bricolage font-bold text-lg bg-gradient-to-r from-[#1f2937] to-[#374151] bg-clip-text text-transparent">
          Orion
        </div>
        <div className="text-sm text-[#6b7280] text-center">
          © 2026 Orion Systems. Precision meets autonomy.
        </div>
        <div className="flex gap-6">
          {["Privacy Policy", "Terms of Service", "Security", "Status"].map((link) => (
            <a key={link} href="#" className="text-xs text-[#6b7280] hover:text-[#2563eb] transition-colors">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ──────────────────────────────────────────────────────────
// Main Dashboard Page
// ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [urlInput, setUrlInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const heroInputRef = useRef<HTMLInputElement>(null)

  const {
    data: runsData,
    isLoading: runsLoading,
    error: runsError,
  } = useQuery({
    queryKey: ["runs", statusFilter, page],
    queryFn: () =>
      runsApi.getRuns({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
      }),
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  })

  const { data: repos } = useQuery({
    queryKey: ["repos"],
    queryFn: () => reposApi.getRepos(),
    staleTime: 30_000,
  })

  const createRunMutation = useMutation({
    mutationFn: (url: string) => runsApi.createRun({ url, mode: 'manual' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["runs"] })
      const targetId = (data as any).runId || data.id
      router.push(`/runs/${targetId}`)
    },
  })

  const runs: Run[] = useMemo(() => (runsData?.data as Run[]) ?? [], [runsData])
  const totalRuns = runsData?.total ?? runs.length
  const totalPages = runsData ? Math.max(1, Math.ceil((runsData.total ?? runs.length) / 10)) : 1
  const lastRun: Run | null = runs.length > 0 ? [...runs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null : null

  const stats = useMemo(() => {
    if (!runsData?.data) return null
    const allRuns = runsData.data as Run[]
    const passedCount = allRuns.filter((r) => r.pass === true).length
    const failedCount = allRuns.filter((r) => r.pass === false).length
    const avgScore = allRuns.length > 0
      ? Math.round(allRuns.reduce((sum, r) => sum + (r.overallScore || 0), 0) / allRuns.length)
      : 0
    return { totalRuns, passedCount, failedCount, avgScore }
  }, [runsData, totalRuns])

  const reposList: ConnectedRepo[] = useMemo(() => repos ?? [], [repos])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = urlInput.trim()
      if (trimmed && !createRunMutation.isPending) {
        createRunMutation.mutate(trimmed)
      }
    },
    [urlInput, createRunMutation]
  )

  const handleNewRunClick = useCallback(() => {
    heroInputRef.current?.focus()
    heroInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8] text-[#1a1f35] flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-4 md:grid-cols-12 gap-6">
          {/* ── Hero Section ── */}
          <section className="col-span-4 md:col-span-12 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center py-12"
            >
              <h1 className="bricolage font-bold text-5xl md:text-7xl leading-tight mb-6 bg-gradient-to-b from-[#1f2937] to-[#374151] bg-clip-text text-transparent">
                Know your site&apos;s health{" "}
                <span className="italic text-transparent bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] bg-clip-text">before</span> your users do.
              </h1>
              <p className="text-lg text-[#6b7280] mb-8 max-w-2xl">Get instant insights into your website performance and health metrics in real-time.</p>
              
              <div className="w-full max-w-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-blue-100/20 rounded-2xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-300" />
                <div className="relative flex gap-3">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2563eb]" />
                    <input
                      ref={heroInputRef}
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/70 border border-blue-100/60 rounded-xl focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 text-[#1a1f35] placeholder-[#9ca3af] outline-none transition-all backdrop-blur-sm"
                      disabled={createRunMutation.isPending}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createRunMutation.isPending || !urlInput.trim()}
                    className="px-8 py-3.5 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    {createRunMutation.isPending ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Scan Now
                      </>
                    )}
                  </button>
                </div>
              </div>
              {createRunMutation.isError && (
                <p className="text-sm text-[#dc2626] mt-4">
                  {(createRunMutation.error as any)?.message || "Failed to start analysis."}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-8 text-sm text-[#6b7280]">
                <span>Or</span>
                <a
                  href={process.env.NEXT_PUBLIC_GITHUB_APP_URL || "https://github.com/apps/orion-qa-agent/installations/new"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 bg-[#1F2328] text-white font-semibold rounded-xl hover:bg-[#0F1419] transition-colors inline-flex items-center gap-2 no-underline"
                >
                  <Code className="w-4 h-4" />
                  Install on GitHub
                </a>
                <span>for automated CI checks</span>
              </div>
            </motion.div>
          </section>

          {/* ── Stats Row ── */}
          {stats && (
            <section className="col-span-4 md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
              <StatCard label="Total Runs" value={stats.totalRuns.toLocaleString()} icon={BarChart3} accent="#0969DA" />
              <StatCard label="Passed" value={stats.passedCount.toLocaleString()} icon={CheckCircle2} accent="#1A7F37" />
              <StatCard label="Failed" value={stats.failedCount.toLocaleString()} icon={XCircle} accent="#CF222E" />
              <StatCard label="Avg Score" value={stats.avgScore} icon={TrendingUp} accent="#9A6700" donut={{ score: stats.avgScore }} />
            </section>
          )}

          {/* ── Main Content (8 cols) ── */}
          <div className="col-span-4 md:col-span-8 flex flex-col gap-6">
            {/* Last Run Banner */}
            {lastRun && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-6 md:p-8 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300 bg-white/60 border border-blue-100/40 backdrop-blur-md hover:bg-white/80 hover:border-blue-200/60"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/20 via-blue-50/10 to-transparent rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 relative z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      {lastRun.pass === true ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-600" />
                          Passed
                        </span>
                      ) : lastRun.pass === false ? (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-600" />
                          Failed
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                          Pending
                        </span>
                      )}
                      <span className="text-xs text-[#6b7280]">{getRelativeTime(lastRun.createdAt)}</span>
                    </div>

                    <h2 className="bricolage font-bold text-2xl text-[#1f2937] mb-2 truncate">
                      {getRunDisplayName(lastRun)}
                    </h2>
                    <p className="text-sm text-[#6b7280] mb-5 truncate">Target: {lastRun.url}</p>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => router.push(`/runs/${(lastRun as any).runId || lastRun.id}`)}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-[#1f2937] border border-blue-200 hover:border-blue-300 hover:bg-blue-100 transition-all flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>
                      {lastRun.pass === false && (
                        <button
                          onClick={() => router.push(`/runs/${(lastRun as any).runId || lastRun.id}?action=fix`)}
                          className="px-4 py-2 bg-gradient-to-r from-[#7c3aed] to-[#6366f1] text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Auto-Fix
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {lastRun.overallScore != null ? (
                      <ScoreArc score={lastRun.overallScore} size={120} animate />
                    ) : (
                      <div className="w-[120px] h-[120px] flex items-center justify-center">
                        <span className="text-sm text-[#8B949E]">No score</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Runs History Table */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl overflow-hidden flex flex-col bg-white/60 border border-blue-100/40 backdrop-blur-md"
            >
              <div className="p-6 border-b border-blue-100/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="bricolage font-bold text-2xl text-[#1f2937]">Recent Runs</h3>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "All", value: "" },
                    { label: "Running", value: "running" },
                    { label: "Completed", value: "completed" },
                    { label: "Failed", value: "failed" },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => { setStatusFilter(value); setPage(1) }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                        statusFilter === value
                          ? "bg-blue-50 text-[#2563eb] border border-blue-200"
                          : "bg-white text-[#6b7280] hover:bg-blue-50/50 border border-blue-100/40"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-50/30 border-b border-blue-100/40">
                      <th className="p-4 text-xs font-bold text-[#6b7280] uppercase tracking-widest w-12">Status</th>
                      <th className="p-4 text-xs font-bold text-[#6b7280] uppercase tracking-widest">Name</th>
                      <th className="p-4 text-xs font-bold text-[#6b7280] uppercase tracking-widest">Score</th>
                      <th className="p-4 text-xs font-bold text-[#6b7280] uppercase tracking-widest">Duration</th>
                      <th className="p-4 text-xs font-bold text-[#6b7280] uppercase tracking-widest">Time</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-[#1f2937]">
                    {runsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-blue-100/20 hover:bg-blue-50/20 transition-colors">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="p-4"><div className="h-4 bg-blue-100 rounded animate-pulse" style={{ width: j === 1 ? 140 : 60 }} /></td>
                          ))}
                        </tr>
                      ))
                    ) : runs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center">
                          <Search className="w-10 h-10 text-[#9ca3af] mx-auto mb-3" />
                          <p className="bricolage font-bold text-[#1f2937]">No runs yet</p>
                          <p className="text-sm text-[#6b7280] mt-1">Enter a URL above to start your first audit.</p>
                        </td>
                      </tr>
                    ) : (
                      runs.map((run) => (
                        <tr
                          key={run.id}
                          onClick={() => router.push(`/runs/${(run as any).runId || run.id}`)}
                          className="border-b border-blue-100/20 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                        >
                          <td className="p-4">
                            {run.pass === true ? (
                              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                            ) : run.pass === false ? (
                              <XCircle className="w-5 h-5 text-[#ef4444]" />
                            ) : run.status === "running" ? (
                              <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                              </motion.div>
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                            )}
                          </td>
                          <td className="p-4 font-medium text-[#1f2937] truncate max-w-[200px] group-hover:text-[#2563eb] transition-colors">{getRunDisplayName(run)}</td>
                          <td className="p-4">
                            {run.overallScore != null ? (
                              <MiniScoreRing score={run.overallScore} />
                            ) : (
                              <span className="text-[#9ca3af]">—</span>
                            )}
                          </td>
                          <td className="p-4 text-[#6b7280]">
                            {run.duration
                              ? formatDuration(run.duration / 1000)
                              : "—"}
                          </td>
                          <td className="p-4 text-[#6b7280]">{getRelativeTime(run.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && !runsLoading && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-blue-100/40">
                  <span className="text-xs text-[#6b7280]">
                    Page {page} of {totalPages} · {totalRuns} total runs
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg hover:bg-blue-50 disabled:opacity-30 transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#6b7280]" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1]
                        const showEllipsis = idx > 0 && prev !== undefined && p - prev > 1
                        return (
                          <div key={p} className="flex items-center gap-1">
                            {showEllipsis && <span className="text-xs text-[#9ca3af] px-1">...</span>}
                            <button
                              onClick={() => setPage(p)}
                              className={cn(
                                "min-w-[32px] h-8 text-xs font-bold rounded-lg transition-all",
                                page === p
                                  ? "bg-[#2563eb] text-white"
                                  : "text-[#6b7280] hover:bg-blue-50"
                              )}
                            >
                              {p}
                            </button>
                          </div>
                        )
                      })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded hover:bg-blue-50 disabled:opacity-30 transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4 text-[#6b7280]" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Sidebar (4 cols) ── */}
          <div className="col-span-4 md:col-span-4 flex flex-col gap-6">
            {/* Connected Repos */}
            <div className="rounded-2xl p-6 bg-white/60 border border-blue-100/40 backdrop-blur-md">
              <h3 className="bricolage font-bold text-xl text-[#1f2937] mb-4">Connected Repos</h3>
              {reposList.length === 0 ? (
                <div className="text-center py-8">
                  <GitBranch className="w-8 h-8 text-[#9ca3af] mx-auto mb-3" />
                  <p className="text-sm text-[#6b7280]">No repos connected</p>
                  <a
                    href={process.env.NEXT_PUBLIC_GITHUB_APP_URL || "https://github.com/apps/orion-ai/installations/new"}
                    target="_blank"
                    rel="noopener noreferrer"
                   className="text-xs text-[#2563eb] hover:text-[#1d4ed8] transition-colors mt-2 inline-block font-semibold"
                  >
                    Connect repository →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {reposList.slice(0, 5).map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-blue-50/50 border border-blue-100/40 hover:border-blue-200/60 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            repo.status === "configured" ? "bg-[#10b981]" :
                            repo.status === "pending" ? "bg-[#f59e0b]" : "bg-[#ef4444]"
                          )}
                        />
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-[#1f2937] block truncate">
                            {repo.fullName || `${repo.owner}/${repo.name}`}
                          </span>
                          {repo.stagingUrl && (
                            <span className="text-xs text-[#6b7280] block truncate">{repo.stagingUrl}</span>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-bold shrink-0 ml-2",
                          repo.status === "configured" ? "text-[#10b981]" :
                          repo.status === "pending" ? "text-[#f59e0b]" : "text-[#ef4444]"
                        )}
                      >
                        {repo.status === "configured" ? "Active" : repo.status === "pending" ? "Pending" : "Error"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl p-6 bg-white/60 border border-blue-100/40 backdrop-blur-md">
              <h3 className="bricolage font-bold text-xl text-[#1f2937] mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleNewRunClick}
                  className="p-6 rounded-xl bg-blue-50 border border-blue-100/40 hover:border-blue-300 hover:bg-blue-100/50 transition-all flex flex-col items-center justify-center gap-2 text-[#2563eb] group"
                >
                  <PlusSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">New Run</span>
                </button>
                <Link
                  href="/runs"
                  className="p-6 rounded-xl bg-purple-50 border border-purple-100/40 hover:border-purple-300 hover:bg-purple-100/50 transition-all flex flex-col items-center justify-center gap-2 text-[#7c3aed] group"
                >
                  <Code className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">All Runs</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}