'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Navbar } from '../../components/Navbar'
import { runsApi } from '@/lib/api'
import { formatDate, formatDuration, getScoreLabel } from '@/lib/utils'
import { AlertCircle, BarChart3, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Run } from '@/lib/types'

export default function RunsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: runsData, isLoading, error } = useQuery({
    queryKey: ['runs'],
    queryFn: async () => {
      try {
        return await runsApi.getRuns({ page: 1, limit: 20 })
      } catch (err) {
        console.error('[v0] Backend error loading runs:', err)
        throw err
      }
    },
    retry: 1,
  })

  if (!mounted) return null

  const runs = runsData?.data || []
  const backendError = error ? true : false

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#1f2937] mb-3">Quality Audits</h1>
          <p className="text-[#6b7280] text-lg">Track all your website audits and their results</p>
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
                <p className="text-sm text-red-700 mt-1">Unable to load audits. Please try again later.</p>
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
              <p className="text-[#6b7280]">Loading audits...</p>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !backendError && runs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 rounded-2xl border border-blue-100/40 bg-white/50 backdrop-blur-sm"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-6">
              <BarChart3 className="w-8 h-8 text-[#2563eb]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1f2937] mb-3">No Audits Yet</h2>
            <p className="text-[#6b7280] mb-8 max-w-sm mx-auto">Get started by running your first quality audit</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Start First Audit
            </Link>
          </motion.div>
        )}

        {/* Runs Table */}
        {!isLoading && !backendError && runs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-100/40 bg-blue-50/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1f2937]">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1f2937]">URL</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-[#1f2937]">Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1f2937]">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#1f2937]">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100/30">
                  {runs.map((run: Run, idx) => (
                    <motion.tr
                      key={run.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => (window.location.href = `/runs/${run.id}`)}
                    >
                      <td className="px-6 py-4">
                        {run.pass === true ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-green-600" />
                            Passed
                          </span>
                        ) : run.pass === false ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-red-600" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#1f2937] font-medium truncate max-w-md">{run.url}</td>
                      <td className="px-6 py-4 text-center">
                        {run.score !== undefined ? (
                          <span className="font-bold text-[#1f2937]">{Math.round(run.score)}</span>
                        ) : (
                          <span className="text-[#6b7280]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#6b7280]">
                        {run.duration ? formatDuration(run.duration) : '—'}
                      </td>
                      <td className="px-6 py-4 text-[#6b7280]">{formatDate(run.createdAt)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
