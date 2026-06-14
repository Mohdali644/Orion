/**
 * Shared TypeScript types for Orion Frontend
 */

import type { ReactNode } from 'react'

export type RunStatus = 'running' | 'complete' | 'failed' | 'queued'
export type RunMode = 'manual' | 'ci'
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low'
export type PipelineStageStatus = 'pending' | 'running' | 'completed' | 'error'

export interface PipelineStage {
  name: string
  status: PipelineStageStatus
  startedAt?: string
  completedAt?: string
  duration?: number
  logs?: string
}

export interface Finding {
  id: string
  runId: string
  severity: FindingSeverity
  title: string
  description: string
  location?: string
  path?: string
  autoFixable: boolean
  codeSnippet?: string
  suggestedFix?: string
  createdAt: string
}

export interface Run {
  id: string
  url: string
  mode: RunMode
  status: RunStatus
  score?: number
  overallScore?: number
  pass?: boolean
  triggerType?: string
  repoId?: string
  prNumber?: string
  commitSha?: string
  branch?: string
  duration?: number
  findings?: Finding[]
  pipelineStages?: PipelineStage[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface ConnectedRepo {
  id: string
  name: string
  owner: string
  fullName: string
  description?: string
  url?: string
  lastChecked?: string
  installationId: string
  stagingUrl: string
  passThreshold: number
  autoFixEnabled: boolean
  ignoredPaths?: string[]
  status: 'configured' | 'pending' | 'error'
  lastRunId?: string
  lastRunScore?: number
  lastRunAt?: string
  createdAt: string
  updatedAt: string
}

export interface RepoDetail extends ConnectedRepo {
  recentRuns?: Run[]
  averageScore?: number
  passRate?: number
  autoFixPRsCreated?: number
}

export interface CreateRunRequest {
  url: string
  mode: 'manual' | 'ci'
  name?: string
  tags?: string[]
  prevRunId?: string
}

export interface UpdateRepoRequest {
  stagingUrl?: string
  passThreshold?: number
  autoFixEnabled?: boolean
  ignoredPaths?: string[]
}

export interface CreateFixPRRequest {
  findingId: string
  runId: string
  repoId: string
}

export interface CreateFixPRResponse {
  prUrl: string
  prNumber: number
  status: 'created' | 'pending'
}

export interface ApiResponse<T> {
  data: T
  error?: string
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
