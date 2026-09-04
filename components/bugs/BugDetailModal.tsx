'use client'

import React from 'react'
import { Sparkles, Edit2, Trash2 } from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { BugItem, BugStatus } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface BugDetailModalProps {
  show: boolean
  bug: BugItem
  displayNumber?: number
  onClose: () => void
  onEdit: (bug: BugItem) => void
  onDelete: (bug: BugItem) => void
  onCopyAI: (bug: BugItem) => void
}

export function BugDetailModal({
  show,
  bug,
  displayNumber,
  onClose,
  onEdit,
  onDelete,
  onCopyAI,
}: BugDetailModalProps) {
  const bugDisplayId = displayNumber !== undefined ? displayNumber : bug.id

  const headerActions = (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onCopyAI(bug)}
        icon={<Sparkles className="w-3.5 h-3.5 text-violet-500" />}
        className="text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/60"
      >
        <span>Copy for AI</span>
      </Button>
      <button
        type="button"
        onClick={() => onEdit(bug)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
        title="Edit"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          onClose()
          onDelete(bug)
        }}
        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )

  const modalTitle = (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs font-bold text-slate-400">#{bugDisplayId}</span>
      <SeverityBadge severity={bug.severity} />
      <StatusBadge status={bug.status} />
    </div>
  )

  return (
    <Modal
      show={show}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      title={modalTitle}
      headerActions={headerActions}
    >
      <div className="p-5 overflow-y-auto space-y-4 no-scrollbar max-h-[calc(90vh-80px)]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-snug">
            {bug.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
            {bug.project && (
              <span className="font-semibold" style={{ color: bug.project.color || '#818cf8' }}>
                {bug.project.name}
              </span>
            )}
            {bug.environment && <span>• {bug.environment}</span>}
            <span>• {new Date(bug.created_at || '').toLocaleDateString()}</span>
            {bug.resolved_commit && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                Commit: {bug.resolved_commit}
              </span>
            )}
          </div>
        </div>

        {/* Fix Hint */}
        {bug.fix_hint && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase text-[10px] block text-amber-700 dark:text-amber-400">
                AI Fix Hint
              </span>
              <span>{bug.fix_hint}</span>
            </div>
          </div>
        )}

        {/* Location */}
        {bug.environment && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-xs">
            <span className="font-bold uppercase text-[10px] text-slate-500 dark:text-zinc-400 block mb-1">
              Location (URL or Path)
            </span>
            <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 select-all">
              {bug.environment}
            </span>
          </div>
        )}

        {/* Suspected File Anchors */}
        {bug.suspected_files && bug.suspected_files.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 text-xs">
            <span className="font-bold uppercase text-[10px] text-slate-500 dark:text-zinc-400 block mb-1">
              Code Locality Anchors ({bug.suspected_files.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {bug.suspected_files.map((file, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[10px] px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400"
                >
                  {file}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description / Trace */}
        {bug.description && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-300">
              What Happened / Error Log
            </h4>
            <div
              className="text-xs prose dark:prose-invert max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(marked.parse(bug.description) as string),
              }}
            />
          </div>
        )}

        {/* Expected Behavior */}
        {bug.expected_result && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-1">
            <h4 className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-300">
              Expected Behavior
            </h4>
            <p className="text-xs text-slate-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {bug.expected_result}
            </p>
          </div>
        )}

        {/* Failed Attempts / Negative Memory */}
        {bug.failed_attempts && bug.failed_attempts.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <span>⚠️ Prior Failed Hypotheses ({bug.failed_attempts.length})</span>
            </h4>
            <div className="space-y-2">
              {bug.failed_attempts.map((attempt, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-rose-200 dark:border-rose-900/50 text-xs">
                  <div className="font-semibold text-rose-800 dark:text-rose-300">
                    {attempt.hypothesis}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                    Failed because: {attempt.failure_reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {bug.attachments && bug.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-slate-700 dark:text-zinc-300">
              Attachments
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {bug.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 relative bg-slate-100 dark:bg-zinc-950"
                >
                  <img
                    src={att.file_path}
                    alt={att.file_name}
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-1.5 text-[10px] truncate bg-white/90 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-300">
                    {att.file_name}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
