'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/shell/dashboard-shell'
import { Button } from '@/components/ui/button'
import { useRuns } from '@/lib/hooks' 
import { motion } from 'framer-motion'
import { formatDate, formatDuration, getStatusColor, getScoreColor, getScoreLabel, truncate } from '@/lib/utils'
import { Loader2, Search, Filter, ExternalLink, AlertCircle } from 'lucide-react'

export default function RunsPage() {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'all' | 'manual' | 'ci'>('all')
  const [status, setStatus] = useState<'all' | 'running' | 'completed' | 'failed'>('all')
  const [page, setPage] = useState(1)

  const params = {
    page,
    limit: 20,
    ...(mode !== 'all' && { mode: mode as 'manual' | 'ci' }),
    ...(status !== 'all' && { status }),
    ...(search && { search }),
  }

  const { data, isLoading, error, refetch } = useRuns(params)

  const runs = data?.data || []
  const total = data?.total || 0
  const hasMore = data?.hasMore || false

  return (
    <DashboardShell>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 style={{ fontFamily: 'var(--font-syne)' }} className="text-4xl font-bold bg-gradient-to-r from-[#1f2937] to-[#374151] bg-clip-text text-transparent">Quality Audits</h1>
          <p className="text-[#6b7280] text-lg">Track all manual and automated quality checks</p>
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-blue-100/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-300" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6b7280]" />
              <input
                type="text"
                placeholder="Search by URL or run ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-blue-100/60 bg-white/70 backdrop-blur-sm text-[#1a1f35] placeholder-[#9ca3af] focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <label className="text-sm font-semibold text-[#1f2937] flex items-center">Type:</label>
              {(['all', 'manual', 'ci'] as const).map((m) => (
                <motion.button
                  key={m}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMode(m)
                    setPage(1)
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    mode === m
                      ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/50 border border-blue-100/40 text-[#6b7280] hover:bg-white/70'
                  }`}
                >
                  {m === 'all' ? 'All' : m === 'manual' ? 'Manual' : 'CI'}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2">
              <label className="text-sm font-semibold text-[#1f2937] flex items-center">Status:</label>
              {(['all', 'running', 'completed', 'failed'] as const).map((s) => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setStatus(s)
                    setPage(1)
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    status === s
                      ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/50 border border-blue-100/40 text-[#6b7280] hover:bg-white/70'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-16"
          >
            <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
          </motion.div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <div className="flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Failed to load audits</p>
                <p className="text-sm text-red-700 mt-1">
                  {(error as any).message || 'Please try again or check your connection.'}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => refetch()}
                className="bg-red-100 text-red-700 hover:bg-red-200"
              >
                Retry
              </Button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !error && runs.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 rounded-2xl border border-blue-100/40 bg-white/50 backdrop-blur-sm"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-4">
              <Filter className="h-7 w-7 text-[#2563eb]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1f2937] mb-2">No audits found</h3>
            <p className="text-[#6b7280] mb-6 max-w-sm mx-auto">
              {search || mode !== 'all' || status !== 'all'
                ? 'Try adjusting your filters to find what you need'
                : 'Get started by running your first quality audit'}
            </p>
            <Link href="/manual">
              <Button className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white hover:shadow-lg hover:shadow-blue-500/30">
                Start Your First Audit
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Runs Table */}
        {!isLoading && !error && runs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-x-auto rounded-2xl border border-blue-100/40 bg-white/50 backdrop-blur-md"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100/40 bg-blue-50/50">
                  <th className="px-6 py-4 text-left font-semibold text-[#1f2937]">URL</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#1f2937]">Type</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#1f2937]">Status</th>
                  <th className="px-6 py-4 text-center font-semibold text-[#1f2937]">Score</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#1f2937]">Duration</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#1f2937]">Created</th>
                  <th className="px-6 py-4 text-right font-semibold text-[#1f2937]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100/30">
                {runs.map((run, idx) => (
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#6b7280]">{run.id.slice(0, 8)}</span>
                        <span className="text-[#1f2937] font-medium truncate max-w-xs" title={run.url}>
                          {truncate(run.url, 40)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-[#2563eb]">
                        {run.mode === 'manual' ? 'Manual' : 'CI'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(run.status)}`}>
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {run.status === 'completed' && run.score !== undefined ? (
                        <div>
                          <span className={`font-bold text-sm ${getScoreColor(run.score)}`}>
                            {Math.round(run.score)}
                          </span>
                          <span className="text-xs text-[#6b7280] ml-2">
                            ({getScoreLabel(run.score)})
                          </span>
                        </div>
                      ) : run.status === 'running' ? (
                        <span className="text-[#6b7280] text-xs">Running...</span>
                      ) : (
                        <span className="text-[#6b7280] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#6b7280]">
                      {run.duration && run.status === 'completed'
                        ? formatDuration(run.duration)
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-[#6b7280]">
                      {formatDate(run.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/runs/${run.id}`}>
                        <Button size="sm" variant="ghost" className="text-[#2563eb] hover:text-[#1d4ed8] hover:bg-blue-50">
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View audit details</span>
                        </Button>
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Pagination */}
        {!isLoading && !error && runs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between pt-6"
          >
            <div className="text-sm text-[#6b7280] font-medium">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} audits
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
                className="border-blue-100/60 text-[#2563eb] hover:bg-blue-50"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!hasMore}
                onClick={() => setPage(page + 1)}
                className="border-blue-100/60 text-[#2563eb] hover:bg-blue-50"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardShell>
  )
}
