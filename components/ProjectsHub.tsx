'use client'

import React from 'react'
import {
  FolderGit2,
  Plus,
  Bug,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Project, BugItem } from '@/types'
import { StatCard } from '@/components/ui/StatCard'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/Button'

interface ProjectsHubProps {
  projects: Project[]
  bugs: BugItem[]
  isGuest?: boolean
  onSelectProject: (projectId: string | null) => void
  onOpenNewProjectModal: () => void
  onEditProject?: (project: Project) => void
}

export function ProjectsHub({
  projects,
  bugs,
  isGuest = false,
  onSelectProject,
  onOpenNewProjectModal,
  onEditProject,
}: ProjectsHubProps) {
  // Global metrics across all bugs
  const totalBugs = bugs.length
  const openBugs = bugs.filter((b) => b.status === 'open').length
  const inProgressBugs = bugs.filter((b) => b.status === 'in_progress').length
  const resolvedBugs = bugs.filter((b) => b.status === 'resolved' || b.status === 'closed').length

  // Helper to compute stats for a specific project
  function getProjectStats(projectId: string | null) {
    const projectBugs =
      projectId === null
        ? bugs.filter((b) => b.project_id === null)
        : bugs.filter((b) => b.project_id === projectId)

    return {
      total: projectBugs.length,
      open: projectBugs.filter((b) => b.status === 'open').length,
      inProgress: projectBugs.filter((b) => b.status === 'in_progress').length,
      resolved: projectBugs.filter((b) => b.status === 'resolved' || b.status === 'closed').length,
      critical: projectBugs.filter(
        (b) => b.severity === 'critical' && b.status !== 'resolved' && b.status !== 'closed'
      ).length,
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Global Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Issues"
          value={totalBugs}
          icon={<Bug className="w-5 h-5" />}
          variant="default"
        />
        <StatCard
          label="Open Backlog"
          value={openBugs}
          icon={<AlertCircle className="w-5 h-5" />}
          variant="indigo"
        />
        <StatCard
          label="In Progress"
          value={inProgressBugs}
          icon={<Clock className="w-5 h-5" />}
          variant="amber"
        />
        <StatCard
          label="Resolved"
          value={resolvedBugs}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />
      </div>

      {/* Projects Grid Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Workspaces & Projects
          </h3>
          <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
            ({projects.length})
          </span>
        </div>

        {!isGuest && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenNewProjectModal}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            <span>New Project</span>
          </Button>
        )}
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Create New Project Action Card or Guest Notice */}
        {!isGuest ? (
          <div
            onClick={onOpenNewProjectModal}
            className="border border-dashed border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[160px] group"
          >
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 group-hover:text-indigo-600 transition mb-2 shadow-2xs">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Add New Project
            </span>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[200px] mt-0.5">
              Configure git repository, tech stack, and test command
            </p>
          </div>
        ) : (
          <div
            onClick={onOpenNewProjectModal}
            className="border border-dashed border-slate-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[160px] group"
          >
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 group-hover:text-indigo-600 transition mb-2 shadow-2xs">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Add New Project
            </span>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[200px] mt-0.5">
              Guest mode is limited to 1 local project. Sign in as admin for multi-project workspaces.
            </p>
          </div>
        )}

        {/* User Projects Cards */}
        {projects.map((proj) => {
          const stats = getProjectStats(proj.id)
          return (
            <ProjectCard
              key={proj.id}
              project={proj}
              stats={stats}
              onSelect={() => onSelectProject(proj.id)}
              onEdit={onEditProject}
            />
          )
        })}
      </div>
    </div>
  )
}
