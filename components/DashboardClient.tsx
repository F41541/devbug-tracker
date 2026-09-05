'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Bug,
  Plus,
  Search,
  Kanban,
  List,
  FolderGit2,
  Copy,
  X,
  RotateCcw,
  LogOut,
  Settings,
  Menu,
  Sparkles,
  Bot,
  Lock,
} from 'lucide-react'
import { ProjectsHub } from '@/components/ProjectsHub'
import { AppSidebar } from '@/components/AppSidebar'
import { Toast, ToastData, ToastType } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Logo } from '@/components/ui/Logo'
import { KanbanView, ListView, BugModal, BugDetailModal } from '@/components/bugs'
import { ProjectManagerModal } from '@/components/projects'
import { CopyAgentPromptModal } from '@/components/bugs/CopyAgentPromptModal'
import { ApiKeyPromptModal } from '@/components/integrations/ApiKeyPromptModal'
import { Modal } from '@/components/ui/Modal'
import { logout } from '@/app/auth/actions'
import { updateBugStatus, deleteBug } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { BugItem, BugStatus, BugSeverity, Project, ApiKey } from '@/types'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

interface DashboardProps {
  initialBugs: BugItem[]
  initialProjects: Project[]
  initialSelectedProjectId?: string | null
  userEmail?: string
  isGuest?: boolean
  fixedWorkspace?: boolean
  initialApiKeys?: ApiKey[]
}

export default function DashboardClient({
  initialBugs,
  initialProjects,
  initialSelectedProjectId = null,
  userEmail,
  isGuest = false,
  fixedWorkspace = false,
  initialApiKeys = [],
}: DashboardProps) {
  const [bugs, setBugs] = useState<BugItem[]>(initialBugs)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<string | null>(
    initialSelectedProjectId || null
  )
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  // Navigation level: 'projects_hub' (root beranda) vs 'workspace' (kanban/list project)
  const [viewLevel, setViewLevel] = useState<'projects_hub' | 'workspace'>(
    fixedWorkspace || initialSelectedProjectId ? 'workspace' : 'projects_hub'
  )

  // Initialize browser local storage for guest
  useEffect(() => {
    if (isGuest && typeof window !== 'undefined') {
      const defaultProject: Project = {
        id: 'local-scratchpad',
        name: 'Local Scratchpad',
        slug: 'local-scratchpad',
        description: 'Offline local-first bug notes stored only in this browser.',
        color: '#6366f1',
      }

      let loadedProjects = [defaultProject]
      try {
        const savedProjects = localStorage.getItem('local_devbug_projects')
        if (savedProjects) {
          const parsed = JSON.parse(savedProjects)
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedProjects = parsed
          }
        }
      } catch (e) {
        console.error('Failed to load local projects', e)
      }

      setProjects(loadedProjects)
      // Jaga selectedProject tetap null jika membuka beranda All Projects (Projects Hub)
      const params = new URLSearchParams(window.location.search)
      const projectParam = params.get('project')
      if (projectParam) {
        setSelectedProject(projectParam)
        setViewLevel('workspace')
      } else if (!fixedWorkspace && !initialSelectedProjectId) {
        setSelectedProject(null)
      } else {
        setSelectedProject(loadedProjects[0]?.id || null)
      }

      try {
        const savedBugs = localStorage.getItem('local_devbug_items')
        if (savedBugs) {
          setBugs(JSON.parse(savedBugs))
        }
      } catch (e) {
        console.error('Failed to load local bugs', e)
      }
    }
  }, [isGuest])

  // Sync projects back to localStorage for guest
  useEffect(() => {
    if (isGuest && typeof window !== 'undefined' && projects.length > 0) {
      try {
        localStorage.setItem('local_devbug_projects', JSON.stringify(projects))
      } catch (e) {
        console.error('Failed to save projects to localStorage', e)
      }
    }
  }, [projects, isGuest])

  // Sync back to localStorage for guest
  useEffect(() => {
    if (isGuest && typeof window !== 'undefined') {
      try {
        localStorage.setItem('local_devbug_items', JSON.stringify(bugs))
      } catch (e) {
        console.error('Failed to save to localStorage', e)
      }
    }
  }, [bugs, isGuest])

  // Check URL query parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const projectParam = params.get('project')
      if (projectParam) {
        setSelectedProject(projectParam)
        setViewLevel('workspace')
      }
    }
  }, [])

  // Modals state
  const [showBugModal, setShowBugModal] = useState(false)
  const [editingBug, setEditingBug] = useState<BugItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBug, setSelectedBug] = useState<BugItem | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [bugToDelete, setBugToDelete] = useState<BugItem | null>(null)
  const [isDeletingBug, setIsDeletingBug] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showCopyAgentModal, setShowCopyAgentModal] = useState(false)
  const [showApiKeyPromptModal, setShowApiKeyPromptModal] = useState(false)
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false)
  const [authRequiredFeature, setAuthRequiredFeature] = useState<string>('Feature')

  // Toast
  const [toast, setToast] = useState<ToastData | null>(null)

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Real-time synchronization with Supabase (only for authenticated users)
  useEffect(() => {
    if (isGuest) return

    const supabase = createClient()

    const channel = supabase
      .channel('realtime_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bug_items' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newBug } = await supabase
              .from('bug_items')
              .select('*, project:projects(*), attachments(*)')
              .eq('id', payload.new.id)
              .single()

            if (newBug && newBug.project) {
              setBugs((prev) => {
                if (prev.some((b) => b.id === newBug.id)) return prev
                return [newBug, ...prev]
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data: updatedBug } = await supabase
              .from('bug_items')
              .select('*, project:projects(*), attachments(*)')
              .eq('id', payload.new.id)
              .single()

            if (updatedBug) {
              setBugs((prev) =>
                prev.map((b) => (b.id === updatedBug.id ? updatedBug : b))
              )
              setSelectedBug((prev) =>
                prev && prev.id === updatedBug.id ? updatedBug : prev
              )
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setBugs((prev) => prev.filter((b) => b.id !== deletedId))
            setSelectedBug((prev) => (prev && prev.id === deletedId ? null : prev))
            setShowDetailModal((prev) => (selectedBug?.id === deletedId ? false : prev))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Verify project is accessible to current user
            const { data: newProj } = await supabase
              .from('projects')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (newProj) {
              setProjects((prev) => {
                if (prev.some((p) => p.id === newProj.id)) return prev
                return [...prev, newProj].sort((a, b) => a.name.localeCompare(b.name))
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data: updatedProj } = await supabase
              .from('projects')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (updatedProj) {
              setProjects((prev) =>
                prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
              )
              setBugs((prev) =>
                prev.map((b) =>
                  b.project_id === updatedProj.id ? { ...b, project: updatedProj } : b
                )
              )
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setProjects((prev) => prev.filter((p) => p.id !== deletedId))
            setBugs((prev) =>
              prev.map((b) =>
                b.project_id === deletedId ? { ...b, project_id: null, project: null } : b
              )
            )
          }
        }
      )
      .subscribe()

    // Resilient background sync polling (every 3s) for active workspaces
    const pollInterval = setInterval(async () => {
      try {
        const query = supabase
          .from('bug_items')
          .select('*, project:projects(*), attachments(*)')
          .order('order', { ascending: true })
          .order('created_at', { ascending: false })

        const { data: latestBugs } = await query
        if (latestBugs && Array.isArray(latestBugs)) {
          setBugs((prev) => {
            // Quick check if there is any difference in length or status/updated_at
            let hasChanged = prev.length !== latestBugs.length
            if (!hasChanged) {
              const prevMap = new Map(prev.map((b) => [b.id, `${b.status}-${b.investigation_state}-${b.updated_at}`]))
              for (const nb of latestBugs) {
                if (prevMap.get(nb.id) !== `${nb.status}-${nb.investigation_state}-${nb.updated_at}`) {
                  hasChanged = true
                  break
                }
              }
            }
            return hasChanged ? latestBugs : prev
          })
        }
      } catch (err) {
        // silent fail on network glitch
      }
    }, 3000)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [selectedBug?.id, selectedProject, fixedWorkspace, isGuest])

  // Map each bug to a project-scoped sequential bug number (1, 2, 3...) based on ascending creation / id
  const projectNumberMap = useMemo(() => {
    const map = new Map<string, number>()
    const byProject: Record<string, BugItem[]> = {}

    for (const b of bugs) {
      const pid = b.project_id || 'unassigned'
      if (!byProject[pid]) byProject[pid] = []
      byProject[pid].push(b)
    }

    for (const pid in byProject) {
      // Sort ascending by created_at (or id) to assign stable, permanent 1..N order
      const list = [...byProject[pid]].sort((a, b) => {
        if (a.created_at && b.created_at && a.created_at !== b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        return a.id.localeCompare(b.id)
      })
      list.forEach((b, index) => {
        map.set(b.id, index + 1)
      })
    }
    return map
  }, [bugs])

  // Filtered bugs
  const filteredBugs = bugs.filter((bug) => {
    if (selectedProject && bug.project_id !== selectedProject) return false
    if (selectedSeverity && bug.severity !== selectedSeverity) return false
    if (selectedStatus && bug.status !== selectedStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const inTitle = bug.title.toLowerCase().includes(q)
      const inDesc = bug.description?.toLowerCase().includes(q) || false
      const inStack = bug.stack_trace?.toLowerCase().includes(q) || false
      if (!inTitle && !inDesc && !inStack) return false
    }
    return true
  })

  // Metrics
  const metrics = {
    total: bugs.length,
    open: bugs.filter((b) => b.status === 'open').length,
    inProgress: bugs.filter((b) => b.status === 'in_progress').length,
    resolved: bugs.filter((b) => b.status === 'resolved' || b.status === 'closed').length,
  }

  const hasActiveFilters = searchQuery || selectedSeverity || selectedStatus

  function resetAllFilters() {
    setSearchQuery('')
    setSelectedSeverity('')
    setSelectedStatus('')
  }

  // Keyboard shortcut: Ctrl+Shift+B / Cmd+Shift+B triggers Single Bug Form
  useKeyboardShortcut('b', () => {
    setEditingBug(null)
    setShowBugModal((prev) => !prev)
  })

  const statusLabels: Record<BugStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  }

  async function handleStatusChange(bugId: string, newStatus: BugStatus) {
    if (isGuest) {
      setBugs((prev) =>
        prev.map((b) =>
          b.id === bugId
            ? {
                ...b,
                status: newStatus,
                resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
              }
            : b
        )
      )
      if (selectedBug?.id === bugId) {
        setSelectedBug((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
      showToast(`Status updated to ${statusLabels[newStatus] || newStatus}`, 'success')
      return
    }

    try {
      await updateBugStatus(bugId, newStatus)
      setBugs((prev) =>
        prev.map((b) =>
          b.id === bugId
            ? {
                ...b,
                status: newStatus,
                resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
              }
            : b
        )
      )
      if (selectedBug?.id === bugId) {
        setSelectedBug((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
      showToast(`Status updated to ${statusLabels[newStatus] || newStatus}`, 'success')
    } catch (e: any) {
      showToast(e.message || 'Failed to update status', 'error')
    }
  }

  async function handleDeleteBug() {
    if (!bugToDelete) return
    setIsDeletingBug(true)

    if (isGuest) {
      setBugs((prev) => prev.filter((b) => b.id !== bugToDelete.id))
      setShowDeleteConfirm(false)
      if (selectedBug?.id === bugToDelete.id) {
        setShowDetailModal(false)
        setSelectedBug(null)
      }
      setBugToDelete(null)
      setIsDeletingBug(false)
      showToast('Bug deleted from local storage', 'success')
      return
    }

    try {
      await deleteBug(bugToDelete.id)
      setBugs((prev) => prev.filter((b) => b.id !== bugToDelete.id))
      setShowDeleteConfirm(false)
      if (selectedBug?.id === bugToDelete.id) {
        setShowDetailModal(false)
        setSelectedBug(null)
      }
      setBugToDelete(null)
      showToast('Bug deleted successfully', 'success')
    } catch (e: any) {
      showToast(e.message || 'Failed to delete bug', 'error')
    } finally {
      setIsDeletingBug(false)
    }
  }

  function handleRequireAuth(featureName: string = 'this feature') {
    setAuthRequiredFeature(featureName)
    setShowAuthRequiredModal(true)
    showToast(`Login required to use ${featureName}`, 'error')
  }

  function handleOpenCopyPrompt() {
    if (isGuest) {
      handleRequireAuth('Copy Prompt & AI Sync')
      return
    }
    const hasKeys = apiKeys && apiKeys.length > 0
    if (!hasKeys) {
      setShowApiKeyPromptModal(true)
      showToast('API Key required! Please generate an API Key first before copying.', 'error')
      return
    }
    setShowCopyAgentModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* DESKTOP SIDEBAR */}
      <AppSidebar
        projects={projects}
        bugs={bugs}
        userEmail={userEmail}
        viewLevel={viewLevel}
        selectedProject={selectedProject}
        onSelectProject={
          fixedWorkspace
            ? undefined
            : (id) => {
                setSelectedProject(id)
                setViewLevel(id === null ? 'projects_hub' : 'workspace')
              }
        }
        onNewBug={() => {
          setEditingBug(null)
          setShowBugModal(true)
        }}
        onManageProjects={() => {
          if (isGuest) {
            handleRequireAuth('Manage Projects')
            return
          }
          setEditingProject(null)
          setShowProjectModal(true)
        }}
        onRequireAuth={handleRequireAuth}
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Navbar */}
        <header className="border-b border-slate-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20 transition-colors w-full">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 gap-3">
              {/* Left Title / Breadcrumb */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700/60"
                  aria-label="Toggle mobile menu"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 text-xs">
                  <span
                    onClick={() => {
                      setViewLevel('projects_hub')
                      setSelectedProject(null)
                    }}
                    className="font-bold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 cursor-pointer hidden sm:inline"
                  >
                    Projects
                  </span>
                  {viewLevel === 'workspace' && (
                    <>
                      <span className="text-slate-300 dark:text-zinc-600 hidden sm:inline">/</span>
                      <span className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {selectedProject
                          ? projects.find((p) => p.id === selectedProject)?.name || 'Project'
                          : 'All Issues'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Minimal Header Actions */}
              <div className="flex items-center gap-2">
                {isGuest ? (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition"
                  >
                    <span>Sign In / Login</span>
                  </Link>
                ) : (
                  /* Metrics Pill (Desktop) */
                  <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[11px] font-mono">
                    <span className="text-slate-500 dark:text-zinc-400">Issues:</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100">{metrics.total}</span>
                    <span className="text-slate-300 dark:text-zinc-600">•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      {metrics.open} Open
                    </span>
                  </div>
                )}

                {/* Copy AI Prompt Button (Visible on project workspace level: fixedWorkspace or selectedProject) */}
                {(fixedWorkspace || (viewLevel === 'workspace' && selectedProject !== null)) && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleOpenCopyPrompt}
                    icon={<Copy className="w-3.5 h-3.5" />}
                  >
                    <span>Copy</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Render Projects Hub or Workspace depending on viewLevel */}
          {viewLevel === 'projects_hub' ? (
            <ProjectsHub
              projects={projects}
              bugs={bugs}
              isGuest={isGuest}
              onSelectProject={(projId) => {
                setSelectedProject(projId)
                setViewLevel('workspace')
              }}
              onOpenNewProjectModal={() => {
                if (isGuest) {
                  handleRequireAuth('Add Project')
                  return
                }
                setEditingProject(null)
                setShowProjectModal(true)
              }}
              onEditProject={
                isGuest
                  ? undefined
                  : (proj) => {
                      setEditingProject(proj)
                      setShowProjectModal(true)
                    }
              }
            />
          ) : (
            <>
              {/* Scoped Project Workspace Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-zinc-800/80">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 truncate">
                      {selectedProject
                        ? projects.find((p) => p.id === selectedProject)?.name || 'Project'
                        : 'All Issues'}
                    </h2>
                    <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
                      ({filteredBugs.length})
                    </span>
                  </div>

                  {/* Tech stack and test command info */}
                  {selectedProject && (() => {
                    const currentProj = projects.find((p) => p.id === selectedProject)
                    return (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                          {currentProj?.repository_url && (
                            <span className="font-mono text-[11px] truncate max-w-xs text-slate-600 dark:text-zinc-400 hover:text-indigo-600">
                              {currentProj.repository_url}
                            </span>
                          )}
                          {currentProj?.tech_stack && currentProj.tech_stack.length > 0 && (
                            <span>• {currentProj.tech_stack.join(', ')}</span>
                          )}
                          {currentProj?.test_command && (
                            <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                              • {currentProj.test_command}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingBug(null)
                      setShowBugModal(true)
                    }}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    <span>New Bug</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewLevel('projects_hub')
                      setSelectedProject(null)
                    }}
                  >
                    ← Projects
                  </Button>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter issues by keyword..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters & View Switcher */}
                <div className="flex items-center gap-2 flex-nowrap shrink-0 overflow-x-auto">
                  <Select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value)}
                    selectSize="sm"
                    className="font-medium bg-white dark:bg-zinc-900"
                  >
                    <option value="">Severity: All</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select>

                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    selectSize="sm"
                    className="font-medium bg-white dark:bg-zinc-900"
                  >
                    <option value="">Status: All</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Reset filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* View Switcher */}
                  <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('kanban')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                        viewMode === 'kanban'
                          ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Kanban className="w-3 h-3" />
                      <span>Board</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      <List className="w-3 h-3" />
                      <span>List</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* View Mode: Kanban vs List */}
              {viewMode === 'kanban' ? (
                <KanbanView
                  bugs={filteredBugs}
                  projectNumberMap={projectNumberMap}
                  onView={(bug) => {
                    setSelectedBug(bug)
                    setShowDetailModal(true)
                  }}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <ListView
                  bugs={filteredBugs}
                  projectNumberMap={projectNumberMap}
                  onView={(bug) => {
                    setSelectedBug(bug)
                    setShowDetailModal(true)
                  }}
                  onEdit={(bug) => {
                    setEditingBug(bug)
                    setShowBugModal(true)
                  }}
                  onDelete={(bug) => {
                    setBugToDelete(bug)
                    setShowDeleteConfirm(true)
                  }}
                  onStatusChange={handleStatusChange}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Bug Create / Edit Modal */}
      {showBugModal && (
        <BugModal
          show={showBugModal}
          bug={editingBug}
          projects={projects}
          selectedProjectId={selectedProject}
          isGuest={isGuest}
          onClose={() => setShowBugModal(false)}
          onSuccess={(savedBug) => {
            setShowBugModal(false)
            setBugs((prev) => {
              const idx = prev.findIndex((b) => b.id === savedBug.id)
              if (idx !== -1) {
                const next = [...prev]
                next[idx] = savedBug
                return next
              }
              return [savedBug, ...prev]
            })
            showToast(editingBug ? 'Bug updated!' : 'Bug recorded!', 'success')
          }}
          notify={showToast}
        />
      )}

      {/* Bug Detail Modal */}
      {showDetailModal && selectedBug && (
        <BugDetailModal
          show={showDetailModal}
          bug={selectedBug}
          displayNumber={projectNumberMap.get(selectedBug.id)}
          onClose={() => setShowDetailModal(false)}
          onEdit={(bug) => {
            setShowDetailModal(false)
            setEditingBug(bug)
            setShowBugModal(true)
          }}
          onDelete={(bug) => {
            setBugToDelete(bug)
            setShowDeleteConfirm(true)
          }}
        />
      )}

      {/* Project Manager Modal */}
      {showProjectModal && (
        <ProjectManagerModal
          show={showProjectModal}
          project={editingProject}
          projects={projects}
          isGuest={isGuest}
          onClose={() => {
            setShowProjectModal(false)
            setEditingProject(null)
          }}
          onProjectsChange={setProjects}
          notify={showToast}
        />
      )}

      {/* Delete Bug Confirmation Modal */}
      {showDeleteConfirm && bugToDelete && (
        <ConfirmDialog
          show={showDeleteConfirm}
          title={`Delete Bug #${bugToDelete.id}`}
          message={
            <span>
              Are you sure you want to delete &ldquo;
              <strong className="text-slate-900 dark:text-zinc-100">{bugToDelete.title}</strong>
              &rdquo;?
            </span>
          }
          isPending={isDeletingBug}
          onConfirm={handleDeleteBug}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Copy AI Agent Prompt Modal */}
      {showCopyAgentModal && (
        <CopyAgentPromptModal
          show={showCopyAgentModal}
          onClose={() => setShowCopyAgentModal(false)}
          bugs={filteredBugs}
          project={projects.find((p) => p.id === selectedProject) || null}
          projectNumberMap={projectNumberMap}
          apiKeys={apiKeys}
          onKeyCreated={(newKey) => setApiKeys((prev) => [newKey, ...prev])}
          notify={showToast}
          isGuest={isGuest}
        />
      )}

      {/* API Key Prompt Modal when attempting to copy prompt without API Key */}
      {showApiKeyPromptModal && (
        <ApiKeyPromptModal
          show={showApiKeyPromptModal}
          onClose={() => setShowApiKeyPromptModal(false)}
          onKeyCreated={(newKey) => {
            setApiKeys((prev) => [newKey, ...prev])
            setShowApiKeyPromptModal(false)
            setShowCopyAgentModal(true)
          }}
          notify={showToast}
          isGuest={isGuest}
        />
      )}

      {/* Auth Required Modal for Guest Users trying to access protected actions */}
      {showAuthRequiredModal && (
        <Modal
          show={showAuthRequiredModal}
          onClose={() => setShowAuthRequiredModal(false)}
          title="Admin Login Required"
          description={`Please log in to your account to use ${authRequiredFeature}.`}
          icon={<Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          maxWidthClass="max-w-md"
        >
          <div className="p-5 space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1 text-xs text-amber-900 dark:text-amber-300">
              <p className="font-bold">Authentication Required</p>
              <p className="leading-relaxed text-amber-800 dark:text-amber-400">
                You are currently viewing the public/guest dashboard. Features like AI Prompt generation, API key sync, and application settings require an authenticated account.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAuthRequiredModal(false)}
              >
                Cancel
              </Button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition"
              >
                Sign In Now
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Mobile Drawer / Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-zinc-800 animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Logo size="md" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">DevBug Tracker</h2>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate max-w-[150px]">
                    {userEmail || 'Admin User'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2 mb-1">
                  Main Menu
                </div>
                {isGuest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false)
                      handleRequireAuth('Settings')
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Settings</span>
                  </button>
                ) : (
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Settings</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false)
                    if (isGuest) {
                      handleRequireAuth('Manage Projects')
                      return
                    }
                    setShowProjectModal(true)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FolderGit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Manage Projects</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-mono">
                    {projects.length}
                  </span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
                    Filter Project
                  </span>
                  {selectedProject !== null && (
                    <button
                      type="button"
                      onClick={() => setSelectedProject(null)}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject(null)
                      setIsMobileSidebarOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedProject === null
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span>All Projects</span>
                    <span className="font-mono text-[11px]">{bugs.length}</span>
                  </button>
                  {projects.map((proj) => {
                    const count = bugs.filter((b) => b.project_id === proj.id).length
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => {
                          setSelectedProject(proj.id)
                          setIsMobileSidebarOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          selectedProject === proj.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: proj.color || '#818cf8' }}
                          />
                          <span className="truncate">{proj.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500 ml-2">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {(fixedWorkspace || (viewLevel === 'workspace' && selectedProject !== null)) && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2 mb-1">
                    AI Agent Task
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileSidebarOpen(false)
                      handleOpenCopyPrompt()
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Copy Prompt to AI Agent</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-600 dark:text-rose-400 dark:hover:text-white rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
