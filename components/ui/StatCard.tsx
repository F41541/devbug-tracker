'use client'

import React from 'react'

export type StatCardVariant = 'default' | 'indigo' | 'amber' | 'emerald' | 'rose'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  variant?: StatCardVariant
  className?: string
}

const VARIANT_STYLES: Record<StatCardVariant, { labelColor: string; valueColor: string; iconBg: string; iconColor: string }> = {
  default: {
    labelColor: 'text-slate-500 dark:text-zinc-400',
    valueColor: 'text-slate-900 dark:text-zinc-100',
    iconBg: 'bg-slate-100 dark:bg-zinc-800',
    iconColor: 'text-slate-600 dark:text-zinc-400',
  },
  indigo: {
    labelColor: 'text-indigo-600 dark:text-indigo-400',
    valueColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  amber: {
    labelColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    labelColor: 'text-emerald-600 dark:text-emerald-400',
    valueColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  rose: {
    labelColor: 'text-rose-600 dark:text-rose-400',
    valueColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-950/50',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
}

export function StatCard({ label, value, icon, variant = 'default', className = '' }: StatCardProps) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 shadow-xs flex items-center justify-between transition-colors ${className}`}>
      <div>
        <p className={`text-[11px] font-medium uppercase tracking-wider ${styles.labelColor}`}>
          {label}
        </p>
        <p className={`text-xl font-bold font-mono mt-0.5 ${styles.valueColor}`}>
          {value}
        </p>
      </div>
      <div className={`p-2.5 rounded-xl ${styles.iconBg} ${styles.iconColor}`}>
        {icon}
      </div>
    </div>
  )
}
