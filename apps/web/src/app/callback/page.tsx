//callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DashboardShell } from '../../components/shell/dashboard-shell'
import { Button } from '@/components/ui/button'
import { reposApi } from '../../lib/api'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  GitBranch,
} from 'lucide-react'

type Repository = {
  owner: string
  name: string
}

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading')

  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleInstallation = async () => {
      try {
        const installationId = searchParams.get('installation_id')
        const setupAction = searchParams.get('setup_action')

        if (!installationId) {
          setStatus('error')
          setError(
            'Missing installation ID. The installation may have failed.'
          )
          return
        }

        console.log('GitHub setup action:', setupAction)

        setMessage('Syncing your repositories...')

        // Parse repositories safely from URL params
        const repoParams = searchParams.getAll('repositories[]')

        const repositories: Repository[] = repoParams
          .map((repo) => {
            const [owner, name] = repo.split('/')

            // Reject malformed repo strings
            if (!owner || !name) {
              return null
            }

            return {
              owner: owner.trim(),
              name: name.trim(),
            }
          })
          .filter(
            (repo): repo is Repository => repo !== null
          )

        // Register repos with backend
        await reposApi.createRepo({
          installationId,
          repositories:
            repositories.length > 0
              ? repositories
              : undefined,
        })

        setStatus('success')
        setMessage('Repositories synced successfully!')

        // Redirect after success
        setTimeout(() => {
          router.push('/repos')
        }, 2000)
      } catch (err: any) {
        console.error('Installation callback error:', err)

        setStatus('error')

        setError(
          err?.message ||
            'Failed to sync repositories. Please try again.'
        )
      }
    }

    handleInstallation()
  }, [searchParams, router])

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto py-16">
        <div className="space-y-8 text-center">
          {/* Loading State */}
          {status === 'loading' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  Installing Orion
                </h1>

                <p className="text-slate-400">
                  {message}
                </p>
              </div>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  Installation Complete!
                </h1>

                <p className="text-slate-400">
                  {message}
                </p>

                <p className="text-sm text-slate-500">
                  Redirecting to your repositories...
                </p>
              </div>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-white">
                  Installation Failed
                </h1>

                <p className="text-red-300">
                  {error}
                </p>

                <p className="text-sm text-slate-500">
                  Please try installing the GitHub App again.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <a
                  href="https://github.com/apps/orion-qa/installations/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <GitBranch className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </a>

                <Button
                  variant="outline"
                  onClick={() => router.push('/repos')}
                >
                  Go to Repos
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}