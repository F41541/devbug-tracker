'use client'

import React from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastData {
  message: string
  type?: ToastType
}

interface ToastProps {
  toast: ToastData | null
  onClose?: () => void
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null

  const type = toast.type || 'success'

  return (
    <div className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white text-slate-900 dark:bg-zinc-900 dark:text-zinc-100 shadow-2xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto max-w-md">
      {type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
      {type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />}
      {type === 'info' && <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
      <span className="leading-snug">{toast.message}</span>
    </div>
  )
}
