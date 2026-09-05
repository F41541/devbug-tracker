'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
}

export function Textarea({
  label,
  required,
  error,
  helperText,
  className = '',
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        required={required}
        rows={rows}
        className={cn(
          'w-full p-3 text-xs bg-slate-50 dark:bg-zinc-950 border rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all',
          error
            ? 'border-rose-500 focus:ring-rose-500/50'
            : 'border-slate-200 dark:border-zinc-800 focus:ring-indigo-500/50',
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
      {helperText && !error && (
        <p className="text-[10px] text-slate-400 dark:text-zinc-500">{helperText}</p>
      )}
    </div>
  )
}
