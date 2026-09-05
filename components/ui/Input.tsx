'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  required?: boolean
  icon?: React.ReactNode
  error?: string
  helperText?: string
}

export function Input({
  label,
  required,
  icon,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          required={required}
          className={cn(
            'w-full pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all',
            icon ? 'pl-9' : 'px-3.5',
            error
              ? 'border-rose-500 focus:ring-rose-500/50'
              : 'border-slate-200 dark:border-zinc-800 focus:ring-indigo-500/50',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
      {helperText && !error && <p className="text-[10px] text-slate-400 dark:text-zinc-500">{helperText}</p>}
    </div>
  )
}
