'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { useRunDetail } from '@/lib/hooks'
import { StatusBadge, SeverityBadge } from '@/components/status/status-badge'
import {
  formatDate,
  formatDuration,
  truncate,
} from '@/lib/utils'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  GitBranch,
  Globe,
  Clock,
  Sparkles,
  ChevronDown,
  Play,
} from 'lucide-react'

interface Finding {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  location?: string
  codeSnippet?: string
  suggestedFix?: string
  autoFixable?: boolean
}

interface PipelineStage {
  name: string
  status: 'completed' | 'running' | 'pending' | 'error'
  duration?: number
}

interface RunDetail {
  id: string
  url: string
  status: 'completed' | 'running' | 'failed'
  mode: 'manual' | 'ci'
  createdAt: string
  duration?: number
  score?: number
  findings?: Finding[]
  pipelineStages?: PipelineStage[]
  prNumber?: string
  branch?: string
  commitSha?: string
}

interface PageProps {
  params: Promise<{ runId: string }>
}

// ──────────────────────────────────────────────────────────
// ScoreRing — uses existing getScoreColor from utils
// ──────────────────────────────────────────────────────────
function getScoreHex(score: number): string {
  if (score >= 80) return '#1A7F37'
  if (score >= 50) return '#9A6700'
  return '#CF222E'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Good'
  if (score >= 50) return 'Needs Work'
  return 'Critical'
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ──────────────────────────────────────────────────────────
// ScoreRing Component
// ──────────────────────────────────────────────────────────
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const center = size / 2
  const radius = center - 12
  const circumference = 2 * Math.PI * radius
  const arcLength = (Math.min(Math.max(score, 0), 100) / 100) * circumference
  const color = getScoreHex(score)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Score: ${score} out of 100`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#E1E2EC" strokeWidth="10" />
        <motion.circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - arcLength }}
          transition={{ type: 'spring', stiffness: 80, damping: 14 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="bricolage font-extrabold text-[28px] leading-none" style={{ color }}>{Math.round(score)}</span>
        <span className="text-[11px] text-[#8B949E] mt-0.5">/100</span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Pipeline Stepper
// ──────────────────────────────────────────────────────────
function PipelineStepper({ stages }: { stages: PipelineStage[] }) {
  if (!stages || stages.length === 0) return null

  return (
    <div className="flex items-center gap-0">
      {stages.map((stage, i) => {
        const isComplete = stage.status === 'completed'
        const isRunning = stage.status === 'running'
        const isError = stage.status === 'error'

        return (
          <div key={stage.name} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                  isComplete
                    ? 'bg-[#E6F4EA] border-[#1A7F37]'
                    : isRunning
                    ? 'bg-[#F0F6FC] border-[#0969DA]'
                    : isError
                    ? 'bg-[#FFEBE9] border-[#CF222E]'
                    : 'bg-[#F6F8FA] border-[#D0D7DE]'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-[#1A7F37]" />
                ) : isRunning ? (
                  <Loader2 className="w-5 h-5 text-[#0969DA] animate-spin" />
                ) : isError ? (
                  <AlertTriangle className="w-5 h-5 text-[#CF222E]" />
                ) : (
                  <span className="text-sm font-bold text-[#8B949E]">{i + 1}</span>
                )}
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${isRunning ? 'text-[#0969DA]' : isComplete ? 'text-[#1A7F37]' : 'text-[#8B949E]'}`}>
                  {stage.name}
                </p>
                {stage.duration && (
                  <p className="text-[10px] text-[#8B949E] mt-0.5">{formatDuration(stage.duration)}</p>
                )}
              </div>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-0.5 flex-1 -mt-5 transition-colors ${
                  isComplete ? 'bg-[#1A7F37]' : isRunning ? 'bg-[#0969DA]' : 'bg-[#E1E2EC]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Main Run Detail Page
// ──────────────────────────────────────────────────────────
export default function RunDetailPage({ params }: PageProps) {
  const [runId, setRunId] = useState<string | null>(null)
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())

  if (!runId) {
    params.then((p) => setRunId(p.runId))
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-[#2563eb] rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const {
    data: run,
    isLoading,
    error,
    refetch,
  } = useRunDetail(runId) as {
    data: RunDetail | undefined
    isLoading: boolean
    error: any
    refetch: () => void
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#2563eb]" />
            <p className="text-sm text-[#6b7280]">Loading run details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20">
          <Link href="/runs" className="inline-flex items-center gap-2 text-[#2563eb] hover:text-[#1d4ed8] mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Runs
          </Link>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#CF222E] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#CF222E]">Failed to load run details</p>
                <p className="text-sm text-[#6b7280] mt-1">
                  {(error as any)?.message || 'The run could not be found or accessed.'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 text-sm font-semibold border border-[#D0D7DE] text-[#1f2937] rounded-lg hover:bg-white transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const toggleFinding = (id: string) => {
    const newSet = new Set(expandedFindings)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedFindings(newSet)
  }

  const findings: Finding[] = run.findings || []
  const criticalFindings = findings.filter((f) => f.severity === 'critical').length
  const highFindings = findings.filter((f) => f.severity === 'high').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Breadcrumb */}
        <Link
          href="/runs"
          className="inline-flex items-center gap-2 text-sm text-[#656D76] hover:text-[#2563eb] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Runs
        </Link>

        {/* ── Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8 mb-6"
        >
          {/* URL + Meta */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-[#8B949E]" />
              <a
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-[#2563eb] hover:underline truncate"
              >
                {run.url}
              </a>
              <ExternalLink className="w-4 h-4 text-[#8B949E] shrink-0" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={run.status} />
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F0F2F5] text-[#656D76] text-xs font-medium rounded-full">
                {run.mode === 'manual' ? (
                  <><Play className="w-3 h-3" /> Manual</>
                ) : (
                  <><GitBranch className="w-3 h-3" /> CI</>
                )}
              </span>
              <span className="text-xs text-[#8B949E]">{getRelativeTime(run.createdAt)}</span>
              {run.duration && run.status === 'completed' && (
                <span className="text-xs text-[#8B949E]">· {formatDuration(run.duration)}</span>
              )}
            </div>
          </div>

          {/* CI Context */}
          {run.mode === 'ci' && (
            <div className="p-4 rounded-xl bg-[#F0F6FC] border border-[#C2DBF5] mb-6">
              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="w-4 h-4 text-[#0969DA]" />
                <span className="text-[#1f2937]">
                  Triggered by <span className="font-semibold">PR #{run.prNumber || '—'}</span>
                  {run.branch && (
                    <> on <code className="bg-[#C2DBF5]/30 px-1.5 py-0.5 rounded text-xs font-mono">{run.branch}</code></>
                  )}
                </span>
              </div>
              {run.commitSha && (
                <p className="text-xs text-[#656D76] mt-1.5 font-mono">Commit: {run.commitSha.slice(0, 7)}</p>
              )}
            </div>
          )}

          {/* Score Section */}
          {run.status === 'completed' && run.score !== undefined ? (
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
              <ScoreRing score={run.score} size={140} />
              <div className="space-y-3 text-center sm:text-left">
                <div>
                  <p className="text-sm text-[#8B949E] mb-0.5">Orion Score</p>
                  <p className="bricolage font-extrabold text-3xl text-[#1f2937]">{Math.round(run.score)}/100</p>
                </div>
                <div>
                  <p className="text-sm text-[#8B949E] mb-0.5">Result</p>
                  <p className="font-bold text-lg" style={{ color: run.score >= 70 ? '#1A7F37' : '#CF222E' }}>
                    {run.score >= 70 ? '✓ Passed' : '✗ Failed'}
                  </p>
                </div>
                {findings.length > 0 && (
                  <div className="flex gap-4 text-sm">
                    {criticalFindings > 0 && <span className="font-bold text-[#CF222E]">{criticalFindings} Critical</span>}
                    {highFindings > 0 && <span className="font-bold text-[#EA580C]">{highFindings} High</span>}
                  </div>
                )}
              </div>
            </div>
          ) : run.status === 'running' ? (
            <div className="p-6 rounded-xl bg-[#F0F6FC] border border-[#C2DBF5] text-center">
              <Loader2 className="h-8 w-8 text-[#2563eb] animate-spin mx-auto mb-3" />
              <p className="font-semibold text-[#1f2937]">Audit in progress...</p>
              <p className="text-sm text-[#6b7280] mt-1">Results will appear as they arrive</p>
            </div>
          ) : null}
        </motion.div>

        {/* ── Pipeline Stages ── */}
        {run.pipelineStages && run.pipelineStages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8 mb-6"
          >
            <h2 className="bricolage font-bold text-lg text-[#1f2937] mb-6">Pipeline Progress</h2>
            <PipelineStepper stages={run.pipelineStages} />
          </motion.div>
        )}

        {/* ── Findings ── */}
        {findings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8"
          >
            <h2 className="bricolage font-bold text-lg text-[#1f2937] mb-6">
              Issues Found ({findings.length})
            </h2>

            <div className="space-y-3">
              {findings.map((finding) => (
                <div
                  key={finding.id}
                  className="rounded-xl border border-[#F0F2F5] bg-white overflow-hidden hover:border-blue-200 transition-colors"
                >
                  <button
                    onClick={() => toggleFinding(finding.id)}
                    className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <SeverityBadge severity={finding.severity} />
                        <h3 className="font-semibold text-[#1f2937]">{finding.title}</h3>
                      </div>
                      <p className="text-sm text-[#6b7280] line-clamp-2">{finding.description}</p>
                      {finding.location && (
                        <p className="text-xs text-[#8B949E] font-mono mt-1.5">{finding.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {finding.autoFixable && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F0F0FF] text-[#8250DF] text-[11px] font-semibold border border-[#8250DF]/20">
                          <Sparkles className="w-3 h-3" />
                          Auto-fixable
                        </span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-[#8B949E] transition-transform ${
                          expandedFindings.has(finding.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {expandedFindings.has(finding.id) && (
                    <div className="border-t border-[#F0F2F5] p-4 bg-[#FAFBFC] space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-[#1f2937] mb-1">Description</h4>
                        <p className="text-sm text-[#6b7280]">{finding.description}</p>
                      </div>

                      {finding.codeSnippet && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#1f2937] mb-1">Code</h4>
                          <pre className="p-3 rounded-lg bg-[#1f2937] text-xs text-[#e1e8ed] overflow-x-auto border border-[#374151]">
                            <code>{finding.codeSnippet}</code>
                          </pre>
                        </div>
                      )}

                      {finding.suggestedFix && (
                        <div className="p-3 rounded-xl bg-[#F0F6FC] border border-[#C2DBF5]">
                          <h4 className="text-sm font-semibold text-[#1f2937] mb-1 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#8250DF]" />
                            Suggested Fix
                          </h4>
                          <p className="text-sm text-[#6b7280]">{finding.suggestedFix}</p>
                        </div>
                      )}

                      {finding.autoFixable && (
                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8250DF] text-white text-sm font-semibold rounded-lg hover:bg-[#6E40C9] transition-colors">
                          <Sparkles className="w-4 h-4" />
                          Create Fix PR
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ) : run.status === 'completed' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[#1A7F37]/20 bg-[#E6F4EA] p-8 text-center"
          >
            <CheckCircle className="h-12 w-12 text-[#1A7F37] mx-auto mb-4" />
            <h3 className="bricolage font-bold text-xl text-[#1f2937] mb-2">No issues found!</h3>
            <p className="text-[#6b7280]">Your website passes all audits with flying colors.</p>
          </motion.div>
        ) : null}
      </main>
    </div>
  )
}