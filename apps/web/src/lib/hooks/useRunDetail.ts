import { useQuery } from '@tanstack/react-query'
import { runsApi } from '../api'
import { Run } from '../types'

export function useRunDetail(runId: string | null) {
  return useQuery({
    queryKey: ['run', runId],
    queryFn: () => runsApi.getRunDetail(runId!),
    enabled: !!runId,
    staleTime: 2000,
    refetchInterval: (query) => {
      // Poll every 2s while running or queued
      const data = query.state.data as Run | undefined
      return data?.status === 'running' || data?.status === 'queued' ? 2000 : false
    },
  })
}
