// src/components/status/status-badge.tsx
import { RunStatus, FindingSeverity } from '@/lib/types'
import { getStatusColor, getSeverityColor } from '@/lib/utils'

interface StatusBadgeProps {
  status: RunStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(status)} ${className}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

interface SeverityBadgeProps {
  severity: FindingSeverity
  className?: string
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-md text-sm font-medium border ${getSeverityColor(severity)} ${className}`}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}
