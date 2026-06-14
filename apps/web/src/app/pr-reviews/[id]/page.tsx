'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { usePRReview } from '@/lib/hooks/usePRReview'
import { StatusBadge, SeverityBadge } from '@/components/status/status-badge'
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  ChevronDown,
  GitPullRequest,
  Github
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
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

export default function PRReviewDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const { id } = resolvedParams
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())

  const { data: review, isLoading, error, refetch } = usePRReview(id)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#2563eb]" />
            <p className="text-sm text-[#6b7280]">Loading PR review details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20">
          <Link href="/repos" className="inline-flex items-center gap-2 text-[#2563eb] hover:text-[#1d4ed8] mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Repositories
          </Link>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#CF222E] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#CF222E]">Failed to load PR review details</p>
                <p className="text-sm text-[#6b7280] mt-1">
                  {(error as any)?.message || 'The review could not be found or accessed.'}
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

  const toggleFinding = (fileIndex: number) => {
    const key = String(fileIndex)
    const newSet = new Set(expandedFindings)
    if (newSet.has(key)) newSet.delete(key)
    else newSet.add(key)
    setExpandedFindings(newSet)
  }

  const findings = review.findings || []
  const criticalFindings = findings.filter((f) => f.severity === 'critical').length
  const highFindings = findings.filter((f) => f.severity === 'high').length

  const prUrl = `https://github.com/${review.owner}/${review.repo}/pull/${review.prNumber}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <Link
          href="/repos"
          className="inline-flex items-center gap-2 text-sm text-[#656D76] hover:text-[#2563eb] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Repositories
        </Link>

        {/* ── Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8 mb-6"
        >
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <GitPullRequest className="w-5 h-5 text-[#8B949E]" />
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-semibold text-[#2563eb] hover:underline truncate"
              >
                {review.owner}/{review.repo} #{review.prNumber}
              </a>
              <ExternalLink className="w-4 h-4 text-[#8B949E] shrink-0" />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <StatusBadge status={review.status === 'pending' ? 'running' : review.status} />
              <span className="text-xs text-[#8B949E]">Analyzed {getRelativeTime(review.createdAt)}</span>
              {review.sha && (
                <span className="text-xs font-mono text-[#656D76] bg-[#F0F2F5] px-2 py-1 rounded">
                  {review.sha.slice(0, 7)}
                </span>
              )}
            </div>
          </div>

          {review.summary && (
            <div className="p-4 rounded-xl bg-[#F0F6FC] border border-[#C2DBF5] mb-6">
              <p className="text-[#1f2937] text-sm leading-relaxed">{review.summary}</p>
            </div>
          )}

          {review.commentUrl && (
            <a
              href={review.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#24292F] text-white text-sm font-semibold rounded-lg hover:bg-[#24292F]/90 transition-colors"
            >
              <Github className="w-4 h-4" />
              View Comment on GitHub
            </a>
          )}
        </motion.div>

        {/* ── Findings ── */}
        {review.status === 'pending' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-12 text-center"
          >
            <Loader2 className="h-10 w-10 text-[#2563eb] animate-spin mx-auto mb-4" />
            <h3 className="font-semibold text-lg text-[#1f2937] mb-2">Analyzing Pull Request...</h3>
            <p className="text-[#6b7280]">Our AI agents are reviewing your code changes for bugs, performance, and best practices.</p>
          </motion.div>
        ) : findings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="bricolage font-bold text-lg text-[#1f2937]">
                Review Findings ({findings.length})
              </h2>
              <div className="flex gap-3 text-sm">
                {criticalFindings > 0 && <span className="font-bold text-[#CF222E]">{criticalFindings} Critical</span>}
                {highFindings > 0 && <span className="font-bold text-[#EA580C]">{highFindings} High</span>}
              </div>
            </div>

            <div className="space-y-4">
              {findings.map((finding, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#F0F2F5] bg-white overflow-hidden hover:border-blue-200 transition-colors"
                >
                  <button
                    onClick={() => toggleFinding(idx)}
                    className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <SeverityBadge severity={finding.severity as any} />
                        <h3 className="font-semibold text-[#1f2937]">{finding.title}</h3>
                      </div>
                      <p className="text-sm text-[#6b7280] line-clamp-2">{finding.detail}</p>
                      {finding.file && (
                        <p className="text-xs text-[#8B949E] font-mono mt-2">
                          {finding.file}{finding.line ? `:${finding.line}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ChevronDown
                        className={`w-5 h-5 text-[#8B949E] transition-transform ${
                          expandedFindings.has(String(idx)) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {expandedFindings.has(String(idx)) && (
                    <div className="border-t border-[#F0F2F5] p-5 bg-[#FAFBFC] space-y-5">
                      <div>
                        <h4 className="text-sm font-semibold text-[#1f2937] mb-1">Issue Details</h4>
                        <p className="text-sm text-[#4b5563] leading-relaxed">{finding.detail}</p>
                      </div>

                      {finding.impact && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#1f2937] mb-1">Potential Impact</h4>
                          <p className="text-sm text-[#4b5563] leading-relaxed">{finding.impact}</p>
                        </div>
                      )}

                      {finding.fixSuggestion && (
                        <div className="p-4 rounded-xl bg-[#F0F6FC] border border-[#C2DBF5]">
                          <h4 className="text-sm font-semibold text-[#1f2937] mb-2">Simple Fix Suggestion</h4>
                          <pre className="p-3 rounded-lg bg-[#1f2937] text-xs text-[#e1e8ed] overflow-x-auto border border-[#374151]">
                            <code>{finding.fixSuggestion}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ) : review.status === 'complete' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[#1A7F37]/20 bg-[#E6F4EA] p-8 text-center"
          >
            <CheckCircle className="h-12 w-12 text-[#1A7F37] mx-auto mb-4" />
            <h3 className="bricolage font-bold text-xl text-[#1f2937] mb-2">No issues found!</h3>
            <p className="text-[#6b7280]">Our code review agents didn't find any issues in this PR.</p>
          </motion.div>
        ) : null}
      </main>
    </div>
  )
}
