'use client'

import React from 'react'
import { Sparkles, Edit2, Trash2 } from 'lucide-react'
import { BugItem, BugStatus } from '@/types'
import { SeverityBadge } from '@/components/ui/Badge'

interface ListViewProps {
  bugs: BugItem[]
  projectNumberMap?: Map<string, number>
  onView: (bug: BugItem) => void
  onEdit: (bug: BugItem) => void
  onDelete: (bug: BugItem) => void
  onStatusChange: (id: string, status: BugStatus) => void
  onCopyAI: (bug: BugItem) => void
}

export function ListView({
  bugs,
  projectNumberMap,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onCopyAI,
}: ListViewProps) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400 font-semibold">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Title & Details</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Environment</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {bugs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                  No bugs found matching your criteria.
                </td>
              </tr>
            ) : (
              bugs.map((bug) => {
                const bugDisplayId = projectNumberMap?.get(bug.id) ?? bug.id
                return (
                  <tr
                    key={bug.id}
                    onClick={() => onView(bug)}
                    className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-center text-slate-400 dark:text-zinc-500 font-semibold">
                      #{bugDisplayId}
                    </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-zinc-100 max-w-md">
                    <div className="line-clamp-1">{bug.title}</div>
                    {bug.description && (
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 font-normal mt-0.5">
                        {bug.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {bug.project ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                        style={{
                          backgroundColor: `${bug.project.color || '#818cf8'}15`,
                          color: bug.project.color || '#818cf8',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: bug.project.color || '#818cf8' }}
                        />
                        {bug.project.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-zinc-500 text-[11px]">General</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <SeverityBadge severity={bug.severity} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={bug.status}
                      onChange={(e) => onStatusChange(bug.id, e.target.value as BugStatus)}
                      className="text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 text-slate-700 dark:text-zinc-300 cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                    {bug.environment || '-'}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onCopyAI(bug)}
                        className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-950/40 text-slate-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        title="Copy Prompt for AI Agent"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(bug)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400"
                        title="Edit Bug"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(bug)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                        title="Delete Bug"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
