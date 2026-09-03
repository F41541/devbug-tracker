'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Project, BugItem } from '@/types'
import { ProjectsHub } from '@/components/ProjectsHub'
import { AppSidebar } from '@/components/AppSidebar'
import { ProjectManagerModal } from '@/components/projects'
import { ApiKeyPromptModal } from '@/components/integrations/ApiKeyPromptModal'
import { Toast, ToastData, ToastType } from '@/components/ui/Toast'

interface ProjectsPageClientProps {
  initialProjects: Project[]
  initialBugs: BugItem[]
  userEmail?: string
  hasApiKeys?: boolean
}

export function ProjectsPageClient({
  initialProjects,
  initialBugs,
  userEmail,
  hasApiKeys = true,
}: ProjectsPageClientProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [bugs, setBugs] = useState<BugItem[]>(initialBugs)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(!hasApiKeys)
  const [toast, setToast] = useState<ToastData | null>(null)

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex selection:bg-indigo-500 selection:text-white transition-colors">
      <Toast toast={toast} />

      <AppSidebar
        projects={projects}
        bugs={bugs}
        userEmail={userEmail}
        viewLevel="projects_hub"
        onManageProjects={() => {
          setEditingProject(null)
          setShowProjectModal(true)
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="border-b border-slate-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20 transition-colors w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-zinc-100">
            <span>Projects Hub</span>
            <span className="text-slate-400 font-normal">({projects.length} Workspaces)</span>
          </div>
        </header>

        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <ProjectsHub
            projects={projects}
            bugs={bugs}
            onSelectProject={(projId) => {
              if (projId === null) return
              const targetProj = projects.find((p) => p.id === projId)
              if (targetProj?.uuid) {
                router.push(`/project/${targetProj.uuid}`)
              }
            }}
            onOpenNewProjectModal={() => {
              setEditingProject(null)
              setShowProjectModal(true)
            }}
            onEditProject={(proj) => {
              setEditingProject(proj)
              setShowProjectModal(true)
            }}
          />
        </main>
      </div>

      {showProjectModal && (
        <ProjectManagerModal
          show={showProjectModal}
          project={editingProject}
          projects={projects}
          isGuest={false}
          onClose={() => setShowProjectModal(false)}
          onProjectsChange={(updated) => {
            if (typeof updated === 'function') {
              setProjects(updated)
            } else {
              setProjects(updated)
            }
          }}
          notify={showToast}
        />
      )}

      {showApiKeyPrompt && (
        <ApiKeyPromptModal
          show={showApiKeyPrompt}
          onClose={() => setShowApiKeyPrompt(false)}
          onKeyCreated={() => {
            setShowApiKeyPrompt(false)
          }}
          notify={showToast}
        />
      )}
    </div>
  )
}
