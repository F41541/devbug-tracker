'use client'

import React, { useState } from 'react'
import { BugItem, BugStatus } from '@/types'
import { BugCard } from './BugCard'

interface KanbanViewProps {
  bugs: BugItem[]
  projectNumberMap?: Map<string, number>
  onView: (bug: BugItem) => void
  onStatusChange: (id: string, status: BugStatus) => void
  onCopyAI?: (bug: BugItem) => void
}

export function KanbanView({
  bugs,
  projectNumberMap,
  onView,
  onStatusChange,
}: KanbanViewProps) {
  const [draggedBugId, setDraggedBugId] = useState<string | null>(null)
  const [activeDropCol, setActiveDropCol] = useState<BugStatus | null>(null)

  const columns: { key: BugStatus; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
  ]

  const handleDragOver = (e: React.DragEvent, colKey: BugStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (activeDropCol !== colKey) {
      setActiveDropCol(colKey)
    }
  }

  const handleDragLeave = (e: React.DragEvent, colKey: BugStatus) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (activeDropCol === colKey) {
        setActiveDropCol(null)
      }
    }
  }

  const handleDrop = (e: React.DragEvent, targetStatus: BugStatus) => {
    e.preventDefault()
    setActiveDropCol(null)
    const bugIdStr = e.dataTransfer.getData('text/plain')
    const bugId = bugIdStr || draggedBugId
    setDraggedBugId(null)

    if (!bugId) return

    const targetBug = bugs.find((b) => b.id === bugId)
    if (targetBug && targetBug.status !== targetStatus) {
      onStatusChange(bugId, targetStatus)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
      {columns.map((col) => {
        const colBugs = bugs.filter((b) => b.status === col.key)
        const isColumnActive = activeDropCol === col.key

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={(e) => handleDragLeave(e, col.key)}
            onDrop={(e) => handleDrop(e, col.key)}
            className={`flex flex-col rounded-xl p-3 min-h-[420px] transition-colors ${
              isColumnActive
                ? 'bg-indigo-50/40 border border-dashed border-indigo-400 dark:bg-indigo-950/20 dark:border-indigo-600'
                : 'bg-slate-100/60 border border-slate-200/80 dark:bg-zinc-900/40 dark:border-zinc-800/80'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/60 dark:border-zinc-800/60">
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {col.label}
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                {colBugs.length}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-0.5 no-scrollbar">
              {colBugs.length === 0 ? (
                <div
                  className={`h-24 flex items-center justify-center border border-dashed rounded-lg text-xs transition-colors ${
                    isColumnActive
                      ? 'border-indigo-400 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-600'
                  }`}
                >
                  {isColumnActive ? `Drop in ${col.label}` : 'No issues'}
                </div>
              ) : (
                colBugs.map((bug) => (
                  <BugCard
                    key={bug.id}
                    bug={bug}
                    displayNumber={projectNumberMap?.get(bug.id)}
                    isDragging={draggedBugId === bug.id}
                    onDragStart={(id) => setDraggedBugId(id)}
                    onDragEnd={() => {
                      setDraggedBugId(null)
                      setActiveDropCol(null)
                    }}
                    onView={() => onView(bug)}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
