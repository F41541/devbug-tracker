'use client'

import React from 'react'
import { Edit2, ArrowRight, Bug, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { Project } from '@/types'

interface ProjectStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  critical: number
}

interface ProjectCardProps {
  project: Project | null
  stats: ProjectStats
  onSelect: () => void
  onEdit?: (project: Project) => void
}

export function ProjectCard({ project, stats, onSelect, onEdit }: ProjectCardProps) {
  const isGeneral = project === null
  const projectName = project ? project.name : 'General / Unassigned'
  const projectColor = project ? project.color || '#6366f1' : '#64748b'

  return (
    <div
      onClick={onSelect}
      className="group relative bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 shadow-xs transition cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Row: Title + Edit button + Total Issues */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: projectColor }}
            />
            <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
              {projectName}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!isGeneral && onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(project)
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                title="Edit Project"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold">
              {stats.total}
            </span>
          </div>
        </div>

        {/* Description or Repository Info */}
        {project?.description && (
          <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-3">
            {project.description}
          </p>
        )}

        {/* Tech stack badges */}
        {project?.tech_stack && project.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {project.tech_stack.slice(0, 3).map((t, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono"
              >
                {t}
              </span>
            ))}
            {project.tech_stack.length > 3 && (
              <span className="text-[10px] px-1 py-0.5 text-slate-400 font-mono">
                +{project.tech_stack.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Mini Stats */}
      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
            <AlertCircle className="w-3 h-3" />
            {stats.open}
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <Clock className="w-3 h-3" />
            {stats.inProgress}
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            {stats.resolved}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}
