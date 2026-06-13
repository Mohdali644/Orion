//repos/page.tsx
'use client'

import Link from 'next/link'
import { DashboardShell } from '../../components/shell/dashboard-shell'
import { Button } from '@/components/ui/button'
import { useRepos } from '../../lib/hooks'
import { formatDate } from '../../lib/utils'

import {
  Loader2,
  GitBranch,
  AlertCircle,
} from 'lucide-react'

type Repo = {
  id: string
  name: string
  owner: string
  status: 'configured' | 'pending' | 'error'
  stagingUrl?: string
  lastRunScore?: number
  lastRunAt?: string
  passThreshold?: number
  autoFixEnabled?: boolean
  ignoredPaths?: string[]
}

export default function ReposPage() {
  const {
    data: repos,
    isLoading,
    error,
    refetch,
  } = useRepos() as {
    data: Repo[] | undefined
    isLoading: boolean
    error: any
    refetch: () => void
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">
              Connected Repositories
            </h1>

            <p className="text-slate-400">
              Manage your GitHub repositories and configuration
            </p>
          </div>

          <a
            href="https://github.com/apps/orion-qa/installations/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <GitBranch className="mr-2 h-4 w-4" />
              Install on GitHub
            </Button>
          </a>
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
                <p className="font-medium text-red-300">
                  Failed to load repositories
                </p>

                <p className="text-sm text-red-200 mt-1">
                  {error?.message ||
                    'Please try again or check your connection.'}
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
        {!isLoading &&
          !error &&
          (!repos || repos.length === 0) && (
            <div className="text-center py-16 rounded-lg border border-slate-700/50 bg-slate-900/30">
              <GitBranch className="h-12 w-12 text-slate-500 mx-auto mb-4" />

              <h3 className="text-lg font-semibold text-white mb-2">
                No repositories connected
              </h3>

              <p className="text-slate-400 mb-6">
                Install Orion on GitHub to connect your
                repositories and enable automatic quality
                checks.
              </p>

              <a
                href="https://github.com/apps/orion-qa/installations/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <GitBranch className="mr-2 h-4 w-4" />
                  Install GitHub App
                </Button>
              </a>
            </div>
          )}

        {/* Repositories Grid */}
        {!isLoading &&
          !error &&
          repos &&
          repos.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {repos.map((repo: Repo) => (
                <Link
                  key={repo.id}
                  href={`/repos/${repo.id}`}
                >
                  <div className="h-full p-6 rounded-lg border border-slate-700/50 bg-slate-900/30 hover:bg-slate-900/50 hover:border-emerald-500/50 transition-all cursor-pointer">
                    <div className="space-y-4">
                      {/* Repo Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg truncate">
                            {repo.name}
                          </h3>

                          <p className="text-sm text-slate-400">
                            {repo.owner}/{repo.name}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          {repo.status ===
                            'configured' && (
                            <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Connected
                            </span>
                          )}

                          {repo.status === 'pending' && (
                            <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Pending
                            </span>
                          )}

                          {repo.status === 'error' && (
                            <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                              Error
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Staging URL */}
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">
                          Staging URL
                        </p>

                        <p className="text-sm text-slate-300 font-mono truncate">
                          {repo.stagingUrl || 'Not configured'}
                        </p>
                      </div>

                      {/* Stats */}
                      {repo.lastRunScore !== undefined && (
                        <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-slate-700/50">
                          <div>
                            <p className="text-xs text-slate-500">
                              Last Score
                            </p>

                            <p className="text-lg font-bold text-white">
                              {Math.round(
                                repo.lastRunScore
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Last Audit
                            </p>

                            <p className="text-xs text-slate-300">
                              {repo.lastRunAt
                                ? formatDate(
                                    repo.lastRunAt
                                  ).split(',')[0]
                                : 'Never'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Threshold
                            </p>

                            <p className="text-lg font-bold text-white">
                              {repo.passThreshold ?? '-'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Repo Config */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">
                            Auto-fix enabled:
                          </span>

                          <span className="text-slate-300">
                            {repo.autoFixEnabled
                              ? '✓'
                              : '✗'}
                          </span>
                        </div>

                        {repo.ignoredPaths &&
                          repo.ignoredPaths.length >
                            0 && (
                            <div className="flex items-start justify-between">
                              <span className="text-slate-500">
                                Ignored paths:
                              </span>

                              <span className="text-slate-300 text-right">
                                {
                                  repo.ignoredPaths
                                    .length
                                }{' '}
                                path
                                {repo.ignoredPaths
                                  .length !== 1
                                  ? 's'
                                  : ''}
                              </span>
                            </div>
                          )}
                      </div>

                      {/* CTA */}
                      <p className="text-xs text-emerald-400">
                        View details →
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
      </div>
    </DashboardShell>
  )
}