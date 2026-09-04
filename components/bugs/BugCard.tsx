'use client'

import React from 'react'
import { Paperclip } from 'lucide-react'
import { BugItem, BugStatus } from '@/types'
import { SeverityBadge } from '@/components/ui/Badge'

interface BugCardProps {
  bug: BugItem
  displayNumber?: number
  isDragging?: boolean
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
  onView: () => void
  onStatusChange: (id: string, status: BugStatus) => void
  onCopyAI?: () => void
}

export function BugCard({
  bug,
  displayNumber,
  isDragging,
  onDragStart,
  onDragEnd,
  onView,
  onStatusChange,
}: BugCardProps) {
  const isClosed = bug.status === 'closed'
  const bugDisplayId = displayNumber !== undefined ? displayNumber : bug.id

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', String(bug.id))
        e.dataTransfer.effectAllowed = 'move'
        onDragStart?.(bug.id)
      }}
      onDragEnd={() => {
        onDragEnd?.()
      }}
      onClick={onView}
      className={`group relative bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-3 transition shadow-xs cursor-grab active:cursor-grabbing select-none flex flex-col gap-2.5 ${
        isClosed ? 'opacity-50' : ''
      } ${
        isDragging ? 'opacity-30 scale-95 border-dashed border-indigo-400 pointer-events-none' : ''
      }`}
    >
      {/* Top Header: ID + Project + Severity */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500 font-semibold">
            #{bugDisplayId}
          </span>
          {bug.project && (
            <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 truncate">
              {bug.project.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <SeverityBadge severity={bug.severity} />
        </div>
      </div>

      {/* Title & Desc */}
      <div>
        <h4
          className={`text-xs font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-snug line-clamp-2 ${
            isClosed ? 'line-through text-slate-400 dark:text-zinc-500' : ''
          }`}
        >
          {bug.title}
        </h4>
        {bug.description && (
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
            {bug.description}
          </p>
        )}
      </div>

      {/* Footer: Date / Attachment / Status Selector */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-400 dark:text-zinc-500">
        <div className="flex items-center gap-2 font-mono">
          <span>
            {new Date(bug.created_at || '').toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {bug.attachments && bug.attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-slate-600 dark:text-zinc-400">
              <Paperclip className="w-2.5 h-2.5" />
              {bug.attachments.length}
            </span>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={bug.status}
            onChange={(e) => onStatusChange(bug.id, e.target.value as BugStatus)}
            className="text-[11px] bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
    </div>
  )
}
