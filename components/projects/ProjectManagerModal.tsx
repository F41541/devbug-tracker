'use client'

import React, { useState, useEffect } from 'react'
import { FolderGit2, Trash2 } from 'lucide-react'
import { Project } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createProject, updateProject, deleteProject } from '@/app/actions'

interface ProjectManagerModalProps {
  show: boolean
  project?: Project | null
  projects: Project[]
  isGuest?: boolean
  onClose: () => void
  onProjectsChange: React.Dispatch<React.SetStateAction<Project[]>>
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function ProjectManagerModal({
  show,
  project,
  projects,
  isGuest = false,
  onClose,
  onProjectsChange,
  notify,
}: ProjectManagerModalProps) {
  const [name, setName] = useState(project?.name || '')
  const [color, setColor] = useState(project?.color || '#6366f1')
  const [desc, setDesc] = useState(project?.description || '')
  const [repoUrl, setRepoUrl] = useState(project?.repository_url || '')
  const [techStack, setTechStack] = useState(project?.tech_stack?.join(', ') || '')
  const [testCommand, setTestCommand] = useState(project?.test_command || 'npm test')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (show) {
      setName(project?.name || '')
      setColor(project?.color || '#6366f1')
      setDesc(project?.description || '')
      setRepoUrl(project?.repository_url || '')
      setTechStack(project?.tech_stack?.join(', ') || '')
      setTestCommand(project?.test_command || 'npm test')
    }
  }, [show, project])

  async function handleSaveProject(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const stackArray = techStack
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      if (isGuest) {
        if (project) {
          const updated: Project = {
            ...project,
            name: name.trim(),
            color,
            description: desc.trim() || undefined,
            repository_url: repoUrl.trim() || undefined,
            tech_stack: stackArray,
            test_command: testCommand.trim() || undefined,
          }
          onProjectsChange((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          onClose()
          notify(`Project "${updated.name}" updated locally`, 'success')
        } else {
          const newId = Date.now()
          const created: Project = {
            id: newId,
            uuid: `guest-${newId}`,
            name: name.trim(),
            slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
            color,
            description: desc.trim() || undefined,
            repository_url: repoUrl.trim() || undefined,
            tech_stack: stackArray,
            test_command: testCommand.trim() || undefined,
          }
          onProjectsChange((prev) => [...prev, created])
          onClose()
          notify(`Project "${created.name}" created in local storage`, 'success')
        }
        return
      }

      if (project) {
        const updated = await updateProject(project.id, {
          name: name.trim(),
          color,
          description: desc.trim() || undefined,
          repository_url: repoUrl.trim() || undefined,
          tech_stack: stackArray,
          test_command: testCommand.trim() || undefined,
        })
        onProjectsChange((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        onClose()
        notify(`Project "${updated.name}" updated successfully`, 'success')
      } else {
        const created = await createProject({
          name: name.trim(),
          color,
          description: desc.trim() || undefined,
          repository_url: repoUrl.trim() || undefined,
          tech_stack: stackArray,
          test_command: testCommand.trim() || undefined,
        })
        onProjectsChange((prev) => [...prev, created])
        onClose()
        notify(`Project "${created.name}" created successfully`, 'success')
      }
    } catch (e: any) {
      notify(e.message || 'Failed to save project', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteProject(id: number) {
    if (isGuest) {
      onProjectsChange((prev) => prev.filter((p) => p.id !== id))
      notify('Project deleted locally', 'success')
      return
    }
    try {
      await deleteProject(id)
      onProjectsChange((prev) => prev.filter((p) => p.id !== id))
      notify('Project deleted', 'success')
    } catch (e: any) {
      notify(e.message || 'Failed to delete project', 'error')
    }
  }

  return (
    <Modal
      show={show}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      icon={<FolderGit2 className="w-4 h-4" />}
      title={project ? `Edit ${project.name}` : 'Create New Project'}
    >
      <div className="p-5 sm:p-6 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto no-scrollbar">
        {/* Project Form */}
        <form
          onSubmit={handleSaveProject}
          className="space-y-3 bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800"
        >
          <Input
            label="Project Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. E-Commerce Web"
          />

          {project?.uuid && (
            <div className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Workspace UUID (MCP)</span>
                <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 select-all">{project.uuid}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(project.uuid || '')
                  notify('Workspace UUID copied!', 'success')
                }}
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-slate-700 dark:text-zinc-300 transition"
              >
                Copy
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              label="Repository URL"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="font-mono text-xs"
            />
            <Input
              label="Tech Stack (comma separated)"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Next.js, Tailwind, Postgres"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              label="Test Command"
              value={testCommand}
              onChange={(e) => setTestCommand(e.target.value)}
              placeholder="npm test"
              className="font-mono text-xs"
            />
            <Input
              label="Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description"
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-5 h-5 rounded-full border-0 p-0 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300 uppercase">
                {color}
              </span>
            </label>

            <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1">
              {project ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>

        {/* Existing Projects List */}
        {!project && (
          <div className="space-y-1.5 overflow-y-auto max-h-44 pr-1 no-scrollbar pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Existing Projects ({projects.length})
            </div>
            {projects.length === 0 ? (
              <p className="text-xs text-center py-4 text-slate-400 dark:text-zinc-500">
                No projects yet.
              </p>
            ) : (
              projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: proj.color || '#818cf8' }}
                    />
                    <span className="text-xs font-medium truncate">{proj.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(proj.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
