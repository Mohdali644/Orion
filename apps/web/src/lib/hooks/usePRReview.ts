import { useQuery } from '@tanstack/react-query'

interface PRReviewFinding {
  file: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  impact?: string;
  line?: number;
  fixSuggestion?: string;
  confidence: "high" | "medium" | "low";
}

interface PRReview {
  id: string;
  owner: string;
  repo: string;
  prNumber: number;
  sha: string;
  status: "pending" | "complete" | "failed";
  summary?: string;
  commentUrl?: string;
  findings?: PRReviewFinding[];
  totalFiles?: number;
  totalFindings?: number;
  createdAt: string;
  completedAt?: string;
}

export function usePRReview(id: string) {
  return useQuery({
    queryKey: ['pr-reviews', id],
    queryFn: async (): Promise<PRReview> => {
      const res = await fetch(`/api/v1/pr-reviews/${id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch PR review details')
      }
      const json = await res.json()
      return json.data
    },
    refetchInterval: (query) => {
      // Keep polling if status is pending
      const data = query.state.data as PRReview | undefined
      if (data?.status === 'pending') {
        return 3000 // Poll every 3s
      }
      return false
    },
  })
}
