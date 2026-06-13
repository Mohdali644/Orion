//manual/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '../../components/shell/dashboard-shell'
import { Button } from '@/components/ui/button'
import { useCreateRun } from '../../lib/hooks'
import { isValidUrl, cn } from '../../lib/utils'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function ManualAuditPage() {
  const router = useRouter()
  const createRunMutation = useCreateRun()
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [touched, setTouched] = useState(false)

  const isValid = url.trim().length > 0 && isValidUrl(url)
  const showError = touched && url.trim().length > 0 && !isValidUrl(url)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    try {
      const result = await createRunMutation.mutateAsync({
        url: url.trim(),
      })
      // Redirect to run detail page
      router.push(`/runs/${result.id}`)
    } catch (error: any) {
      setUrlError(
        error.message || 'Failed to create audit. Please try again.'
      )
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
      <div className="max-w-2xl mx-auto py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white">Manual Audit</h1>
            <p className="text-lg text-slate-400">
              Audit any public URL without connecting to GitHub. No authentication needed.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="url" className="block text-sm font-medium text-slate-200">
                Website URL
              </label>
              <div className="relative">
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="https://example.com"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border bg-slate-900/50 text-white placeholder-slate-500 transition-all',
                    showError
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  )}
                />
              </div>

              {/* Error Message */}
              {showError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{urlError || 'Please enter a valid URL'}</span>
                </div>
              )}

              {/* URL Validation Success */}
              {touched && isValid && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>URL is valid</span>
                </div>
              )}

              {/* Helper Text */}
              {!touched && (
                <p className="text-sm text-slate-500">
                  Enter the full URL including https://
                </p>
              )}
            </div>

            {/* API Error Banner */}
            {createRunMutation.error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-300">
                  {(createRunMutation.error as any).message || 'An error occurred. Please try again.'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isValid || createRunMutation.isPending}
              className={cn(
                'w-full py-3 text-base font-medium transition-all',
                isValid && !createRunMutation.isPending
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              )}
            >
              {createRunMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Audit...
                </>
              ) : (
                <>
                  Start Audit
                </>
              )}
            </Button>
          </form>

          {/* Info Section */}
          <div className="space-y-4 p-6 rounded-lg border border-slate-700/50 bg-slate-900/30">
            <h3 className="font-semibold text-white">What gets audited?</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>Performance metrics (LCP, FID, CLS, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>Accessibility compliance (WCAG AA)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>Best practices and security headers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>Code quality and standards</span>
              </li>
            </ul>
          </div>

          {/* Try Demo Link */}
          <div className="text-center p-6 rounded-lg border border-slate-700/50 bg-slate-900/30">
            <p className="text-sm text-slate-400 mb-3">
              Want to see an example? Try our demo site:
            </p>
            <button
              onClick={() => setUrl('https://example.com')}
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
            >
              Load example.com
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
