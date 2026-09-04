'use client'

import React from 'react'
import { BugSeverity, BugStatus } from '@/types'

export const SEVERITY_CONFIG: Record<BugSeverity, { label: string; icon: string; className: string }> = {
  critical: {
    label: 'Critical',
    icon: '🔴',
    className: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40',
  },
  high: {
    label: 'High',
    icon: '🟠',
    className: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/40',
  },
  medium: {
    label: 'Medium',
    icon: '🟡',
    className: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/40',
  },
  low: {
    label: 'Low',
    icon: '🟢',
    className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40',
  },
}

export const STATUS_CONFIG: Record<BugStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40',
  },
  in_progress: {
    label: 'In Progress',
    className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40',
  },
  resolved: {
    label: 'Resolved',
    className: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40',
  },
  closed: {
    label: 'Closed',
    className: 'text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700',
  },
}

interface SeverityBadgeProps {
  severity: BugSeverity
  showIcon?: boolean
  className?: string
}

export function SeverityBadge({ severity, showIcon = false, className = '' }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${config.className} ${className}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  )
}

interface StatusBadgeProps {
  status: BugStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open

  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
