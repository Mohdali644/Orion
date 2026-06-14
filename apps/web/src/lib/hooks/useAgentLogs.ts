import { useState, useEffect, useRef } from 'react'

export interface AgentLog {
  id: string
  type: 'log' | 'agent_started' | 'agent_completed' | 'score_updated' | 'error'
  runId: string
  agent: string
  timestamp: string
  message?: string
  status?: string
  meta?: {
    score?: number
    [key: string]: any
  }
}

export function useAgentLogs(runId: string | null) {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!runId) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      ws.send(JSON.stringify({ type: 'subscribe', runId }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Omit<AgentLog, 'id'>
        // Make sure it matches our runId or it's a global message
        if (data.runId === runId || data.runId === 'global') {
          setLogs((prev) => [...prev, { ...data, id: Math.random().toString(36).substr(2, 9) }])
        }
      } catch (err) {
        console.error('Failed to parse agent log', err)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [runId])

  return { logs, isConnected }
}
