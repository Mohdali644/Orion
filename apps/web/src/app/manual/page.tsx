'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/shell/dashboard-shell'
import { Button } from '@/components/ui/button'
import { runsApi } from '@/lib/api'
import { isValidUrl, cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Loader2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ManualAuditPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [touched, setTouched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = url.trim().length > 0 && isValidUrl(url)
  const showError = touched && url.trim().length > 0 && !isValidUrl(url)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    try {
      setIsLoading(true)
      setError(null)
      const result = await runsApi.createRun({ url: url.trim() })
      router.push(`/runs/${result.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create audit. Please try again.')
      setUrlError(err.message || 'Failed to create audit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setUrlError('')
    if (touched && value.trim().length > 0) {
      if (!isValidUrl(value)) {
        setUrlError('Please enter a valid URL (e.g., https://example.com)')
      }
    }
  }

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-2">
              <Sparkles className="w-7 h-7 text-[#2563eb]" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-syne)' }} className="text-4xl font-bold bg-gradient-to-r from-[#1f2937] to-[#374151] bg-clip-text text-transparent">Instant Quality Audit</h1>
            <p className="text-lg text-[#6b7280] max-w-2xl mx-auto">
              Analyze any public URL instantly. No signup required. See performance metrics, accessibility issues, and actionable insights in seconds.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <label htmlFor="url" className="block text-sm font-semibold text-[#1f2937]">
                Website URL
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-blue-100/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-300" />
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="https://example.com"
                  className={cn(
                    'relative w-full px-5 py-4 rounded-2xl border bg-white/70 backdrop-blur-sm text-[#1a1f35] placeholder-[#9ca3af] font-medium transition-all duration-300',
                    showError
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-blue-100/60 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20'
                  )}
                />
              </div>

              {/* Validation Messages */}
              {showError && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-600 text-sm font-medium"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{urlError || 'Please enter a valid URL'}</span>
                </motion.div>
              )}

              {touched && isValid && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-green-600 text-sm font-medium"
                >
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>URL is valid and ready to audit</span>
                </motion.div>
              )}

              {!touched && (
                <p className="text-sm text-[#6b7280]">
                  Include https:// in your URL
                </p>
              )}
            </motion.div>

            {/* API Error Banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-200 bg-red-50 p-4"
              >
                <p className="text-sm text-red-700 font-medium">
                  {error}
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              type="submit"
              disabled={!isValid || isLoading}
              className={cn(
                'w-full py-4 text-base font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2',
                isValid && !isLoading
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Starting Audit...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Start Quality Audit
                </>
              )}
            </motion.button>
          </form>

          {/* Features Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-4 pt-4"
          >
            <div className="rounded-2xl p-6 bg-white/50 border border-blue-100/40 backdrop-blur-md hover:bg-white/70 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-1.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#1f2937]">Performance Metrics</h3>
                  <p className="text-sm text-[#6b7280] mt-1">LCP, FID, CLS, and other Web Vitals</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl p-6 bg-white/50 border border-blue-100/40 backdrop-blur-md hover:bg-white/70 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-1.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#1f2937]">Accessibility</h3>
                  <p className="text-sm text-[#6b7280] mt-1">WCAG AA compliance issues detected</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl p-6 bg-white/50 border border-blue-100/40 backdrop-blur-md hover:bg-white/70 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-1.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#1f2937]">Best Practices</h3>
                  <p className="text-sm text-[#6b7280] mt-1">Security headers and standards compliance</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl p-6 bg-white/50 border border-blue-100/40 backdrop-blur-md hover:bg-white/70 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#2563eb] mt-1.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-[#1f2937]">Code Quality</h3>
                  <p className="text-sm text-[#6b7280] mt-1">HTML/CSS/JavaScript standards validation</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </DashboardShell>
  )
}
