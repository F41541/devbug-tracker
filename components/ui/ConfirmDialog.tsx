'use client'

import React from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  show: boolean
  title: string
  description?: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  show,
  title,
  description = 'This action cannot be undone.',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      show={show}
      onClose={onClose}
      maxWidthClass="max-w-md"
      icon={
        variant === 'danger' ? (
          <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        )
      }
      title={title}
      description={description}
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
          {message}
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`py-2.5 px-4 text-xs font-semibold text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
            }`}
          >
            {isPending ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
