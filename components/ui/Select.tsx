'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type SelectSize = 'sm' | 'md'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  required?: boolean
  error?: string
  selectSize?: SelectSize
}

const SIZE_CLASSES: Record<SelectSize, string> = {
  sm: 'px-2 py-1 text-xs rounded-lg',
  md: 'px-3 py-2 text-xs rounded-xl',
}

export function Select({
  label,
  required,
  error,
  selectSize = 'md',
  className = '',
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={cn(label ? 'w-full space-y-1' : 'inline-block')}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={cn(
          label ? 'w-full' : 'w-auto',
          'bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors',
          SIZE_CLASSES[selectSize],
          error && 'border-rose-500 focus:ring-rose-500/50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
  )
}
