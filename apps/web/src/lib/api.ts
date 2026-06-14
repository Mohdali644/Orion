/**
 * Typed API Client for Orion Backend
 * All requests go to /api/v1/*
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import {
  Run,
  ConnectedRepo,
  RepoDetail,
  CreateRunRequest,
  UpdateRepoRequest,
  CreateFixPRRequest,
  CreateFixPRResponse,
  PaginatedResponse,
} from './types'

// Initialize axios instance
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Map frontend 'completed' status filter to backend 'complete' database enum
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.params && config.params.status === 'completed') {
      config.params = {
        ...config.params,
        status: 'complete',
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Helper to recursively map status field from 'complete' to 'completed'
function mapStatus(val: any): any {
  if (!val) return val
  if (Array.isArray(val)) {
    return val.map(mapStatus)
  }
  if (typeof val === 'object') {
    const newVal = { ...val }
    if (newVal.status === 'complete') {
      newVal.status = 'completed'
    }
    for (const key of Object.keys(newVal)) {
      if (newVal[key] && typeof newVal[key] === 'object') {
        newVal[key] = mapStatus(newVal[key])
      }
    }
    return newVal
  }
  return val
}

// Unpack the standard { success, data, pagination } server envelope
axiosInstance.interceptors.response.use(
  (response) => {
    const payload = response.data
    if (payload && typeof payload === 'object' && 'success' in payload) {
      if (payload.success === false) {
        const errorMsg = payload.error?.message || 'API error'
        const errorStatus = payload.error?.statusCode || response.status
        const errorCode = payload.error?.code
        const err = new Error(errorMsg) as any
        err.status = errorStatus
        err.code = errorCode
        throw err
      }
      
      if (payload.pagination) {
        response.data = {
          data: mapStatus(payload.data),
          ...payload.pagination,
        }
      } else {
        response.data = mapStatus(payload.data)
      }
    }
    return response
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public originalError?: AxiosError
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Runs API
export const runsApi = {
  async createRun(payload: CreateRunRequest): Promise<Run> {
    try {
      const { data } = await axiosInstance.post<Run>('/runs', payload)
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async getRuns(params?: {
    page?: number
    limit?: number
    mode?: 'manual' | 'ci'
    status?: string
    search?: string
    repoId?: string
  }): Promise<PaginatedResponse<Run>> {
    try {
      const { data } = await axiosInstance.get<PaginatedResponse<Run>>('/runs', {
        params,
      })
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async getRunDetail(runId: string): Promise<Run> {
    try {
      const { data } = await axiosInstance.get<Run>(`/runs/${runId}`)
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async getRunLogs(runId: string): Promise<{ logs: string }> {
    try {
      const { data } = await axiosInstance.get<{ logs: string }>(
        `/runs/${runId}/logs`
      )
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },
}

// Repos API
export const reposApi = {
  async getRepos(): Promise<ConnectedRepo[]> {
    try {
      const { data } = await axiosInstance.get<ConnectedRepo[]>('/repos')
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async createRepo(payload: {
    installationId: string
    repositories?: Array<{ name: string; owner: string }>
  }): Promise<ConnectedRepo[]> {
    try {
      const { data } = await axiosInstance.post<ConnectedRepo[]>(
        '/repos',
        payload
      )
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async getRepoDetail(repoId: string): Promise<RepoDetail> {
    try {
      const { data } = await axiosInstance.get<RepoDetail>(`/repos/${repoId}`)
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async updateRepo(
    repoId: string,
    payload: UpdateRepoRequest
  ): Promise<ConnectedRepo> {
    try {
      const { data } = await axiosInstance.patch<ConnectedRepo>(
        `/repos/${repoId}`,
        payload
      )
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async deleteRepo(repoId: string): Promise<void> {
    try {
      await axiosInstance.delete(`/repos/${repoId}`)
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async testRepo(repoId: string): Promise<Run> {
    try {
      const { data } = await axiosInstance.post<Run>(`/repos/${repoId}/test`)
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },
}

// Findings API
export const findingsApi = {
  async getFinding(findingId: string): Promise<any> {
    try {
      const { data } = await axiosInstance.get(`/findings/${findingId}`)
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  async createFixPR(payload: CreateFixPRRequest): Promise<CreateFixPRResponse> {
    try {
      const { data } = await axiosInstance.post<CreateFixPRResponse>(
        `/findings/${payload.findingId}/create-pr`,
        payload
      )
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },
}

// GitHub / Webhooks API
export const githubApi = {
  async getInstallationStatus(): Promise<{ installed: boolean; appUrl: string }> {
    try {
      const { data } = await axiosInstance.get('/github/installation-status')
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },

  getInstallUrl(): string {
    return `https://github.com/apps/orion-qa/installations/new`
  },

  // Exchange GitHub OAuth callback code and installation ID for connected repos
  async exchangeCallback(
    code: string,
    installationId: string
  ): Promise<{ repos: ConnectedRepo[]; success: boolean }> {
    try {
      const { data } = await axiosInstance.post('/github/callback', {
        code,
        installation_id: installationId,
      })
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },
}

// Health check
export const healthApi = {
  async check(): Promise<{ status: 'ok' }> {
    try {
      const { data } = await axiosInstance.get('/health')
      return data
    } catch (error) {
      throw handleApiError(error)
    }
  },
}

// Error handling helper
function handleApiError(error: any): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 500
    const responseData = error.response?.data as any
    let message =
      responseData?.error?.message ||
      responseData?.message ||
      error.message

    if (status === 404) {
      message = 'Resource not found. It may have been deleted.'
    } else if (status === 401) {
      message = 'Unauthorized. Please check your session.'
    } else if (status === 422) {
      message =
        responseData?.details || 'Invalid input. Please check your data.'
    } else if (status >= 500) {
      message = 'Server error. Please try again later.'
    } else if (!error.response) {
      message = 'Unable to reach server. Check your connection.'
    }

    return new ApiError(status, message, error)
  }

  return new ApiError(500, 'An unexpected error occurred', undefined)
}

export default axiosInstance