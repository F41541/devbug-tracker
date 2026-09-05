'use client'

import React from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

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
  description,
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
    >
      <div className="p-5 sm:p-6 space-y-5">
        <div className="space-y-1.5">
          <div className="text-sm text-slate-700 dark:text-zinc-200 font-medium leading-relaxed">
            {message}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            className="px-4"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={isPending}
            className="px-4"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
