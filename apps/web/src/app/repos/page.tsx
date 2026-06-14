'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Navbar } from '../../components/Navbar'
import { reposApi } from '@/lib/api'
import { AlertCircle, GitBranch, ExternalLink, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ConnectedRepo } from '@/lib/types'

export default function ReposPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: reposData, isLoading, error } = useQuery({
    queryKey: ['repos'],
    queryFn: async () => {
      try {
        return await reposApi.getRepos()
      } catch (err) {
        console.error('[v0] Backend error loading repos:', err)
        throw err
      }
    },
    retry: 1,
  })

  if (!mounted) return null

  const repos = reposData || []
  const backendError = error ? true : false

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1f2937] mb-3">Connected Repositories</h1>
          <p className="text-[#6b7280] text-lg">Manage your GitHub repositories for CI integration</p>
        </div>

        {/* Backend Error State */}
        {backendError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <div className="flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Backend Not Responding</h3>
                <p className="text-sm text-red-700 mt-1">Unable to load repositories. Please try again later.</p>
                <p className="text-xs text-red-600 mt-2 font-mono">Check console for error details</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && !backendError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[#6b7280]">Loading repositories...</p>
            </div>
          </motion.div>
        )}

        {/* No Repos Connected - Onboarding */}
        {!isLoading && !backendError && repos.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md overflow-hidden"
          >
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 mb-6">
                <GitBranch className="w-10 h-10 text-[#2563eb]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">No Repos Connected Yet</h2>
              <p className="text-[#6b7280] mb-8 max-w-lg mx-auto">
                Connect your GitHub repositories to enable automated quality audits in your CI/CD pipeline. Our GitHub App will monitor your repositories and run quality checks on every push.
              </p>

              {/* Onboarding Steps */}
              <div className="grid md:grid-cols-3 gap-6 mb-12 text-left max-w-3xl mx-auto">
                <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100/60">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-200 text-[#2563eb] font-bold mb-4">
                    1
                  </div>
                  <h3 className="font-semibold text-[#1f2937] mb-2">Install GitHub App</h3>
                  <p className="text-sm text-[#6b7280]">
                    Click the button below to install the Orion GitHub App on your account or organization.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100/60">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-200 text-[#2563eb] font-bold mb-4">
                    2
                  </div>
                  <h3 className="font-semibold text-[#1f2937] mb-2">Select Repositories</h3>
                  <p className="text-sm text-[#6b7280]">
                    Choose which repositories you want to monitor with Orion quality audits.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100/60">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-200 text-[#2563eb] font-bold mb-4">
                    3
                  </div>
                  <h3 className="font-semibold text-[#1f2937] mb-2">Automatic Checks</h3>
                  <p className="text-sm text-[#6b7280]">
                    Orion will automatically run quality audits and report results in your pull requests.
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <a
                href="https://github.com/apps/orion-qa/installations/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 font-semibold text-lg"
              >
                <GitBranch className="w-5 h-5" />
                Connect GitHub Repository
              </a>
            </div>
          </motion.div>
        )}

        {/* Repos List */}
        {!isLoading && !backendError && repos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6"
          >
            {repos.map((repo: ConnectedRepo, idx) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 hover:bg-white/80 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 flex-shrink-0">
                      <GitBranch className="w-6 h-6 text-[#2563eb]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#1f2937] text-lg truncate">
                            {repo.fullName || `${repo.owner}/${repo.name}`}
                          </h3>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                          repo.status === 'configured' ? 'bg-green-100 text-green-700' :
                          repo.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {repo.status === 'configured' ? 'Configured' : 
                           repo.status === 'pending' ? 'Pending' : 'Disconnected'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 mt-4 text-sm text-[#6b7280] flex-wrap">
                        {repo.stagingUrl && (
                          <span title={repo.stagingUrl} className="truncate">
                            Staging: {new URL(repo.stagingUrl).hostname}
                          </span>
                        )}
                        {repo.passThreshold && (
                          <span>Pass Threshold: {repo.passThreshold}%</span>
                        )}
                        {repo.lastChecked && (
                          <span>Last checked: {new Date(repo.lastChecked).toLocaleDateString()}</span>
                        )}
                        <a
                          href={`https://github.com/${repo.owner}/${repo.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#2563eb] hover:underline"
                        >
                          View on GitHub
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Connect More */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: repos.length * 0.05 }}
              className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center"
            >
              <p className="text-[#6b7280] mb-4">Want to connect more repositories?</p>
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_APP_URL || "https://github.com/apps/orion-qa-agent/installations/new"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 font-semibold no-underline"
              >
                <GitBranch className="w-4 h-4" />
                Connect Another Repo
              </a>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  )
}