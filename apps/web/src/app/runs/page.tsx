//runs/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/shell/dashboard-shell'
import { Button } from '@/components/ui/button'
import { useRuns } from '@/lib/hooks'
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
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Audit Runs</h1>
          <p className="text-slate-400">View all manual and automated quality audits</p>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by URL or run ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <label className="text-sm text-slate-400 flex items-center">Mode:</label>
              {(['all', 'manual', 'ci'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m)
                    setPage(1)
                  }}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    mode === m
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  {m === 'all' ? 'All' : m === 'manual' ? 'Manual' : 'CI'}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <label className="text-sm text-slate-400 flex items-center">Status:</label>
              {(['all', 'running', 'completed', 'failed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s)
                    setPage(1)
                  }}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    status === s
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-300">Failed to load runs</p>
                <p className="text-sm text-red-200 mt-1">
                  {(error as any).message || 'Please try again or check your connection.'}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && runs.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 mb-4">
              <Filter className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No runs found</h3>
            <p className="text-slate-400 mb-6">
              {search || mode !== 'all' || status !== 'all'
                ? 'Try adjusting your filters'
                : 'Start with a manual audit or install on GitHub'}
            </p>
            <Link href="/manual">
              <Button>Start Manual Audit</Button>
            </Link>
          </div>
        )}

        {/* Runs Table */}
        {!isLoading && !error && runs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">URL</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Mode</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-300">Score</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Duration</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Created</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-slate-700/30 hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{run.id.slice(0, 8)}</span>
                        <span className="text-slate-300 truncate max-w-xs" title={run.url}>
                          {truncate(run.url, 40)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-slate-900/50 text-slate-300 border border-slate-700/50">
                        {run.mode === 'manual' ? 'Manual' : 'CI'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(run.status)}`}>
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {run.status === 'completed' && run.score !== undefined ? (
                        <div>
                          <span className={`font-semibold ${getScoreColor(run.score)}`}>
                            {Math.round(run.score)}
                          </span>
                          <span className="text-xs text-slate-500 ml-1">
                            ({getScoreLabel(run.score)})
                          </span>
                        </div>
                      ) : run.status === 'running' ? (
                        <span className="text-slate-500 text-xs">Running...</span>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {run.duration && run.status === 'completed'
                        ? formatDuration(run.duration)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDate(run.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/runs/${run.id}`}>
                        <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300">
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">View run details</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && runs.length > 0 && (
          <div className="flex items-center justify-between pt-6">
            <div className="text-sm text-slate-400">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} runs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!hasMore}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
