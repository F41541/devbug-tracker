'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bug,
  Plus,
  Search,
  Kanban,
  List,
  FolderGit2,
  Download,
  FileDown,
  FileCode2,
  Copy,
  ChevronDown,
  X,
  RotateCcw,
  LogOut,
  Laptop,
  Clock,
  Paperclip,
  CheckCircle2,
  Eye,
  Trash2,
  Edit2,
  AlertCircle,
  UploadCloud,
  Check,
  Code2,
  FileText,
  User,
  Settings,
  Menu,
  Sparkles,
  Bot,
  GripVertical
} from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ThemeToggle } from '@/components/ThemeToggle'
import { logout } from '@/app/auth/actions'
import {
  createBug,
  updateBug,
  updateBugStatus,
  deleteBug,
  createProject,
  updateProject,
  deleteProject,
  deleteAttachment
} from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { BugItem, BugStatus, BugSeverity, Project } from '@/types'

interface DashboardProps {
  initialBugs: BugItem[]
  initialProjects: Project[]
  userEmail?: string
}

export default function DashboardClient({
  initialBugs,
  initialProjects,
  userEmail,
}: DashboardProps) {
  const [bugs, setBugs] = useState<BugItem[]>(initialBugs)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedSeverity, setSelectedSeverity] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  // Modals state
  const [showBugModal, setShowBugModal] = useState(false)
  const [editingBug, setEditingBug] = useState<BugItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBug, setSelectedBug] = useState<BugItem | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [bugToDelete, setBugToDelete] = useState<BugItem | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Export menu
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const exportDropdownRef = useRef<HTMLDivElement>(null)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Real-time synchronization with Supabase
  useEffect(() => {
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

            if (newBug) {
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
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProj = payload.new as Project
            setProjects((prev) => {
              if (prev.some((p) => p.id === newProj.id)) return prev
              return [...prev, newProj].sort((a, b) => a.name.localeCompare(b.name))
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedProj = payload.new as Project
            setProjects((prev) =>
              prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
            )
            setBugs((prev) =>
              prev.map((b) =>
                b.project_id === updatedProj.id ? { ...b, project: updatedProj } : b
              )
            )
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedBug?.id])

  // Click outside export dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const hasActiveFilters = searchQuery || selectedProject || selectedSeverity || selectedStatus

  function resetAllFilters() {
    setSearchQuery('')
    setSelectedProject(null)
    setSelectedSeverity('')
    setSelectedStatus('')
  }

  // Bug handlers
  const statusLabels: Record<BugStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  }

  async function handleStatusChange(bugId: number, newStatus: BugStatus) {
    try {
      await updateBugStatus(bugId, newStatus)
      setBugs((prev) =>
        prev.map((b) =>
          b.id === bugId
            ? { ...b, status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null }
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
    }
  }

  // Export handlers
  function downloadExport(format: 'markdown' | 'json') {
    setIsExportMenuOpen(false)
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredBugs, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `devbug-export-${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      showToast('JSON export downloaded', 'success')
      return
    }

    let md = `# DevBug Tracker Report\nGenerated on: ${new Date().toLocaleString()}\nTotal Bugs: ${filteredBugs.length}\n\n`
    filteredBugs.forEach((b, idx) => {
      md += `## ${idx + 1}. [${b.severity.toUpperCase()}] ${b.title}\n`
      md += `- **ID:** #${b.id}\n- **Status:** ${b.status}\n- **Project:** ${b.project?.name || 'General'}\n- **Environment:** ${b.environment || 'N/A'}\n\n`
      if (b.description) md += `### Description\n${b.description}\n\n`
      if (b.steps_to_reproduce) md += `### Steps to Reproduce\n${b.steps_to_reproduce}\n\n`
      if (b.stack_trace) md += `### Stack Trace\n\`\`\`\n${b.stack_trace}\n\`\`\`\n\n`
      md += `---\n\n`
    })

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devbug-report-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Markdown report downloaded', 'success')
  }

  function generateAIPromptForBug(bug: BugItem): string {
    let prompt = `# Bug Report: [${bug.severity.toUpperCase()}] ${bug.title} (#${bug.id})\n\n`
    prompt += `## Context\n`
    prompt += `- **Project:** ${bug.project?.name || 'General'}\n`
    prompt += `- **Status:** ${bug.status}\n`
    prompt += `- **Severity:** ${bug.severity}\n`
    if (bug.environment) prompt += `- **Environment:** ${bug.environment}\n`
    if (bug.created_at) prompt += `- **Logged At:** ${new Date(bug.created_at).toISOString()}\n`
    prompt += `\n`

    if (bug.description) {
      prompt += `## Description\n${bug.description}\n\n`
    }
    if (bug.steps_to_reproduce) {
      prompt += `## Steps to Reproduce\n${bug.steps_to_reproduce}\n\n`
    }
    if (bug.expected_result) {
      prompt += `## Expected Result\n${bug.expected_result}\n\n`
    }
    if (bug.actual_result) {
      prompt += `## Actual Result\n${bug.actual_result}\n\n`
    }
    if (bug.stack_trace) {
      prompt += `## Stack Trace / Error Log\n\`\`\`\n${bug.stack_trace}\n\`\`\`\n\n`
    }

    prompt += `## Task for AI Agent\n`
    prompt += `1. Analyze the issue details and error context above.\n`
    prompt += `2. Locate the root cause in the relevant source code.\n`
    prompt += `3. Provide and apply the minimal and clean fix to resolve this bug.\n`

    return prompt
  }

  function copyBugForAI(bug: BugItem) {
    const prompt = generateAIPromptForBug(bug)
    navigator.clipboard.writeText(prompt)
    showToast(`Bug #${bug.id} prompt copied for AI!`, 'success')
  }

  function copyMarkdownReport() {
    setIsExportMenuOpen(false)
    let md = `# DevBug Tracker Summary (${filteredBugs.length} bugs)\n\n`
    filteredBugs.forEach((b, idx) => {
      md += `${idx + 1}. **[${b.severity.toUpperCase()} / ${b.status}]** #${b.id} ${b.title} (${b.project?.name || 'General'})\n`
    })
    navigator.clipboard.writeText(md)
    showToast('Summary copied to clipboard!', 'success')
  }

  function copyAllForAI() {
    setIsExportMenuOpen(false)
    let prompt = `# Task List: Resolve DevBug Issues (${filteredBugs.length} bugs)\n\n`
    filteredBugs.forEach((b, idx) => {
      prompt += `### Bug ${idx + 1}: [${b.severity.toUpperCase()}] #${b.id} ${b.title}\n`
      prompt += `- **Project:** ${b.project?.name || 'General'}\n`
      prompt += `- **Status:** ${b.status}\n`
      if (b.environment) prompt += `- **Environment:** ${b.environment}\n`
      if (b.description) prompt += `- **Description:** ${b.description}\n`
      if (b.steps_to_reproduce) prompt += `- **Steps:** ${b.steps_to_reproduce}\n`
      if (b.stack_trace) prompt += `- **Stack Trace:**\n\`\`\`\n${b.stack_trace}\n\`\`\`\n`
      prompt += `\n---\n\n`
    })
    prompt += `## Task for AI Agent\nReview each bug above, prioritize critical and high issues, and implement the necessary fixes.\n`
    navigator.clipboard.writeText(prompt)
    showToast('AI Task Prompt copied to clipboard!', 'success')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Toast Notification (Highest z-index so it shows over modals) */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white text-slate-900 dark:bg-zinc-900 dark:text-zinc-100 shadow-2xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />}
          {toast.type === 'info' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Floating Action Button (FAB) for Reporting New Bug */}
      <button
        type="button"
        onClick={() => {
          setEditingBug(null)
          setShowBugModal(true)
        }}
        title="Report New Bug"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center gap-2 p-3.5 sm:px-5 sm:py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-full shadow-2xl shadow-indigo-600/50 hover:shadow-indigo-600/60 transition-all duration-200 group border border-indigo-400/30"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
        <span className="hidden sm:inline font-medium">New Bug</span>
      </button>

      {/* Top Header Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30 transition-colors w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 flex-shrink-0">
                <Bug className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                    DevBug
                  </h1>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block truncate">
                  Developer issue & stack trace logger
                </p>
              </div>
            </div>

            {/* Metrics Counter (Desktop) */}
            <div className="hidden xl:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 dark:bg-zinc-950/70 dark:border-zinc-800/80 text-xs">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Total:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-zinc-100">{metrics.total}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">Open:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{metrics.open}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-700 dark:text-amber-300 font-medium">In Progress:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{metrics.inProgress}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">Resolved:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{metrics.resolved}</span>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Mobile Sidebar Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                title="Open Menu"
                className="md:hidden p-2 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700/60 transition-colors"
                aria-label="Toggle mobile menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Export Dropdown */}
              <div className="relative hidden md:block" ref={exportDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  title="Export Data"
                  className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700/60 transition-colors"
                >
                  <Download className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-400 hidden sm:inline" />
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl py-1 z-40 text-xs">
                    <button
                      type="button"
                      onClick={() => downloadExport('markdown')}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 flex items-center gap-2.5"
                    >
                      <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Download Markdown Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadExport('json')}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 flex items-center gap-2.5"
                    >
                      <FileCode2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Download JSON Dump</span>
                    </button>
                    <div className="h-px bg-slate-200 dark:bg-zinc-800 my-1" />
                    <button
                      type="button"
                      onClick={copyAllForAI}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 flex items-center gap-2.5"
                    >
                      <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span>Copy AI Agent Prompt Task</span>
                    </button>
                    <button
                      type="button"
                      onClick={copyMarkdownReport}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 flex items-center gap-2.5"
                    >
                      <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Copy Markdown Summary</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Manage Projects Button (Desktop) */}
              <button
                type="button"
                onClick={() => setShowProjectModal(true)}
                title="Manage Projects"
                className="hidden md:inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700/60 transition-colors"
              >
                <FolderGit2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Projects</span>
              </button>

              {/* Account Settings Link (Desktop) */}
              <Link
                href="/account"
                title="Pengaturan Akun"
                className="hidden md:inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700/60 transition-colors"
              >
                <Settings className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-600 dark:text-zinc-400" />
                <span className="hidden sm:inline">Settings</span>
              </Link>

              {/* Logout Button (Desktop) */}
              <form action={logout} className="hidden md:block">
                <button
                  type="submit"
                  title={`Logout (${userEmail || 'Admin'})`}
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 bg-white hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/30 rounded-lg border border-slate-200 dark:border-zinc-700/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Mobile Metrics Bar */}
        <div className="flex xl:hidden items-center gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 dark:bg-zinc-900/60 dark:border-zinc-800/80 whitespace-nowrap">
            <span className="text-slate-500 dark:text-zinc-400">Total:</span>
            <span className="font-mono font-bold">{metrics.total}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-indigo-700 dark:text-indigo-300">Open:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{metrics.open}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-amber-700 dark:text-amber-300">In Progress:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{metrics.inProgress}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-300">Resolved:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{metrics.resolved}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200/90 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm dark:shadow-xl backdrop-blur-md space-y-3 sm:space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, description, logs..."
                className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Switcher */}
            <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 dark:bg-zinc-950/80 p-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-3 pb-1 px-1 border-t border-slate-200/60 dark:border-zinc-800/60 text-xs">
            {/* Project Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 w-full sm:w-auto">
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex-shrink-0">Project:</span>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedProject === null
                    ? 'bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                All
              </button>
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setSelectedProject(proj.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedProject === proj.id
                      ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color || '#818cf8' }} />
                  <span>{{ ...proj }.name}</span>
                </button>
              ))}
            </div>

            {/* Dropdowns & Reset */}
            <div className="flex flex-wrap items-center gap-2.5 py-1 px-1 sm:ml-auto">
              {/* Severity Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:inline">Severity:</span>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="">All Severities</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:inline">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 ml-auto flex items-center gap-1 font-medium transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Mode: Kanban vs List */}
        {viewMode === 'kanban' ? (
          <KanbanView
            bugs={filteredBugs}
            onView={(bug) => {
              setSelectedBug(bug)
              setShowDetailModal(true)
            }}
            onStatusChange={handleStatusChange}
            onCopyAI={copyBugForAI}
          />
        ) : (
          <ListView
            bugs={filteredBugs}
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
            onCopyAI={copyBugForAI}
          />
        )}
      </main>

      {/* Bug Create / Edit Modal */}
      {showBugModal && (
        <BugModal
          show={showBugModal}
          bug={editingBug}
          projects={projects}
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
            showToast(editingBug ? 'Bug updated successfully' : 'Bug reported successfully', 'success')
          }}
          notify={showToast}
        />
      )}

      {/* Bug Detail Modal */}
      {showDetailModal && selectedBug && (
        <BugDetailModal
          show={showDetailModal}
          bug={selectedBug}
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
          onStatusChange={handleStatusChange}
          onCopyAI={copyBugForAI}
          notify={showToast}
        />
      )}

      {/* Mobile Drawer / Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-zinc-800 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                  <Bug className="w-5 h-5" />
                </div>
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

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Navigation / Main Actions */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2 mb-1">
                  Menu Utama
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false)
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
                <Link
                  href="/account"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Pengaturan Akun</span>
                </Link>
              </div>

              {/* Projects Quick Filter */}
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
                    <span>Semua Project</span>
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

              {/* Export Actions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <div className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase px-2 mb-1">
                  Export Laporan
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false)
                    downloadExport('markdown')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  <FileDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Download Markdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false)
                    downloadExport('json')
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  <FileCode2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Download JSON Dump</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false)
                    copyAllForAI()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>Copy AI Agent Prompt Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false)
                    copyMarkdownReport()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  <Copy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Copy Summary Clipboard</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
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

      {/* Project Manager Modal */}
      {showProjectModal && (
        <ProjectManagerModal
          show={showProjectModal}
          projects={projects}
          onClose={() => setShowProjectModal(false)}
          onProjectsChange={setProjects}
          notify={showToast}
        />
      )}

      {/* Delete Bug Confirmation Modal */}
      {showDeleteConfirm && bugToDelete && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Delete Bug #{bugToDelete.id}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-zinc-100">&ldquo;{bugToDelete.title}&rdquo;</span>?
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBug}
                className="py-2.5 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                Delete Bug
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------- SUB-COMPONENTS ----------------

function KanbanView({
  bugs,
  onView,
  onStatusChange,
  onCopyAI,
}: {
  bugs: BugItem[]
  onView: (bug: BugItem) => void
  onStatusChange: (id: number, status: BugStatus) => void
  onCopyAI: (bug: BugItem) => void
}) {
  const [draggedBugId, setDraggedBugId] = useState<number | null>(null)
  const [activeDropCol, setActiveDropCol] = useState<BugStatus | null>(null)

  const columns: { key: BugStatus; label: string; color: string }[] = [
    { key: 'open', label: 'Open', color: 'border-indigo-500/30 text-indigo-500' },
    { key: 'in_progress', label: 'In Progress', color: 'border-amber-500/30 text-amber-500' },
    { key: 'resolved', label: 'Resolved', color: 'border-emerald-500/30 text-emerald-500' },
    { key: 'closed', label: 'Closed', color: 'border-slate-500/30 text-slate-400' },
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
    const bugId = bugIdStr ? parseInt(bugIdStr, 10) : draggedBugId
    setDraggedBugId(null)

    if (!bugId) return

    const targetBug = bugs.find((b) => b.id === bugId)
    if (targetBug && targetBug.status !== targetStatus) {
      onStatusChange(bugId, targetStatus)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colBugs = bugs.filter((b) => b.status === col.key)
        const isColumnActive = activeDropCol === col.key

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={(e) => handleDragLeave(e, col.key)}
            onDrop={(e) => handleDrop(e, col.key)}
            className={`flex flex-col rounded-2xl p-3.5 min-h-[450px] transition-all duration-150 ${
              isColumnActive
                ? 'bg-indigo-50/70 border-2 border-indigo-500 dark:bg-indigo-950/30 dark:border-indigo-400 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-100/70 border border-slate-400/50 dark:bg-zinc-900/40 dark:border-zinc-800/80'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-400/60 dark:border-zinc-800/60 mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold">
                  {colBugs.length}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {colBugs.length === 0 ? (
                <div
                  className={`h-32 flex items-center justify-center border-2 border-dashed rounded-xl text-xs transition-colors ${
                    isColumnActive
                      ? 'border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 font-medium'
                      : 'border-slate-300 dark:border-zinc-800/80 text-slate-400 dark:text-zinc-600'
                  }`}
                >
                  {isColumnActive ? `Drop bug here for ${col.label}` : `No bugs in ${col.label}`}
                </div>
              ) : (
                colBugs.map((bug) => (
                  <BugCard
                    key={bug.id}
                    bug={bug}
                    isDragging={draggedBugId === bug.id}
                    onDragStart={(id) => setDraggedBugId(id)}
                    onDragEnd={() => {
                      setDraggedBugId(null)
                      setActiveDropCol(null)
                    }}
                    onView={() => onView(bug)}
                    onStatusChange={onStatusChange}
                    onCopyAI={() => onCopyAI(bug)}
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

function BugCard({
  bug,
  isDragging,
  onDragStart,
  onDragEnd,
  onView,
  onStatusChange,
  onCopyAI,
}: {
  bug: BugItem
  isDragging?: boolean
  onDragStart?: (id: number) => void
  onDragEnd?: () => void
  onView: () => void
  onStatusChange: (id: number, status: BugStatus) => void
  onCopyAI: () => void
}) {
  const severityStyles: Record<
    BugSeverity,
    { outline: string; bgBadge: string; textBadge: string; dot: string }
  > = {
    critical: {
      outline: 'border-rose-500/60 dark:border-rose-500/50 bg-white dark:bg-zinc-900 hover:border-rose-500 dark:hover:border-rose-400 shadow-sm hover:shadow-md hover:shadow-rose-500/10',
      bgBadge: 'bg-rose-500/15 border-rose-500/30',
      textBadge: 'text-rose-600 dark:text-rose-400',
      dot: 'bg-rose-500',
    },
    high: {
      outline: 'border-amber-500/60 dark:border-amber-500/50 bg-white dark:bg-zinc-900 hover:border-amber-500 dark:hover:border-amber-400 shadow-sm hover:shadow-md hover:shadow-amber-500/10',
      bgBadge: 'bg-amber-500/15 border-amber-500/30',
      textBadge: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    medium: {
      outline: 'border-indigo-500/60 dark:border-indigo-500/50 bg-white dark:bg-zinc-900 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-sm hover:shadow-md hover:shadow-indigo-500/10',
      bgBadge: 'bg-indigo-500/15 border-indigo-500/30',
      textBadge: 'text-indigo-600 dark:text-indigo-400',
      dot: 'bg-indigo-500',
    },
    low: {
      outline: 'border-emerald-500/60 dark:border-emerald-500/50 bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-400 shadow-sm hover:shadow-md hover:shadow-emerald-500/10',
      bgBadge: 'bg-emerald-500/15 border-emerald-500/30',
      textBadge: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
  }

  const sev = severityStyles[bug.severity] || severityStyles.medium

  const isClosed = bug.status === 'closed'
  const isResolved = bug.status === 'resolved'

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
      className={`group relative ${sev.outline} hover:bg-slate-50 dark:hover:bg-zinc-850/90 border-2 rounded-2xl p-4 transition-all duration-150 cursor-grab active:cursor-grabbing select-none flex flex-col gap-3 ${
        isClosed
          ? 'opacity-60 grayscale-[40%] bg-slate-100/60 dark:bg-zinc-900/40 border-slate-300/60 dark:border-zinc-800/60 shadow-none hover:opacity-90 hover:grayscale-0'
          : ''
      } ${
        isDragging ? 'opacity-40 scale-[0.98] border-dashed border-indigo-400 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400 flex-shrink-0 cursor-grab" />
          {bug.project ? (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md border truncate max-w-[120px]"
              style={{
                backgroundColor: `${bug.project.color || '#818cf8'}15`,
                color: bug.project.color || '#818cf8',
                borderColor: `${bug.project.color || '#818cf8'}40`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: bug.project.color || '#818cf8' }} />
              <span className="truncate">{bug.project.name}</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase font-semibold">General</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onCopyAI()
            }}
            title="Copy Prompt for AI Agent"
            className="p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:text-violet-400 dark:hover:bg-violet-950/40 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${sev.bgBadge} ${sev.textBadge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
            {bug.severity}
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-start gap-1.5">
          <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500 font-bold flex-shrink-0 mt-0.5">#{bug.id}</span>
          <h4 className={`text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-white line-clamp-2 leading-snug ${
            isClosed ? 'line-through text-slate-500 dark:text-zinc-400' : ''
          }`}>
            {bug.title}
          </h4>
        </div>
        {bug.description && (
          <p className={`text-xs line-clamp-2 mt-1 leading-relaxed ${
            isClosed ? 'text-slate-400 dark:text-zinc-500' : 'text-slate-600 dark:text-zinc-400'
          }`}>
            {bug.description}
          </p>
        )}
      </div>

      {bug.environment && (
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-950/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 w-fit max-w-full truncate">
          <Laptop className="w-3 h-3 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
          <span className="truncate">{bug.environment}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-zinc-800/80 mt-auto text-xs text-slate-400 dark:text-zinc-500">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(bug.created_at || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          {bug.attachments && bug.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300 font-medium">
              <Paperclip className="w-3 h-3" />
              {bug.attachments.length}
            </span>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <select
            value={bug.status}
            onChange={(e) => onStatusChange(bug.id, e.target.value as BugStatus)}
            className="text-[11px] font-medium bg-slate-100 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
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

function ListView({
  bugs,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onCopyAI,
}: {
  bugs: BugItem[]
  onView: (bug: BugItem) => void
  onEdit: (bug: BugItem) => void
  onDelete: (bug: BugItem) => void
  onStatusChange: (id: number, status: BugStatus) => void
  onCopyAI: (bug: BugItem) => void
}) {
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
              bugs.map((bug) => (
                <tr
                  key={bug.id}
                  onClick={() => onView(bug)}
                  className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/60 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono text-center text-slate-400 dark:text-zinc-500 font-semibold">
                    #{bug.id}
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
                        style={{ backgroundColor: `${bug.project.color || '#818cf8'}15`, color: bug.project.color || '#818cf8' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bug.project.color || '#818cf8' }} />
                        {bug.project.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-zinc-500 text-[11px]">General</span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="uppercase font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                      {bug.severity}
                    </span>
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
                        onClick={() => onView(bug)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------- MODALS ----------------

function BugModal({
  show,
  bug,
  projects,
  onClose,
  onSuccess,
  notify,
}: {
  show: boolean
  bug: BugItem | null
  projects: Project[]
  onClose: () => void
  onSuccess: (bug: BugItem) => void
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [title, setTitle] = useState(bug?.title || '')
  const [projectId, setProjectId] = useState<number | null>(bug?.project_id || null)
  const [description, setDescription] = useState(bug?.description || '')
  const [environment, setEnvironment] = useState(bug?.environment || '')
  const [severity, setSeverity] = useState<BugSeverity>(bug?.severity || 'medium')
  const [status, setStatus] = useState<BugStatus>(bug?.status || 'open')
  const [stepsToReproduce, setStepsToReproduce] = useState(bug?.steps_to_reproduce || '')
  const [stackTrace, setStackTrace] = useState(bug?.stack_trace || '')
  const [expectedResult, setExpectedResult] = useState(bug?.expected_result || '')
  const [actualResult, setActualResult] = useState(bug?.actual_result || '')
  const [activeTab, setActiveTab] = useState<'desc' | 'steps' | 'stack' | 'attach'>('desc')
  const [descPreview, setDescPreview] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset fields when opening
  useEffect(() => {
    if (show) {
      if (bug) {
        setTitle(bug.title || '')
        setProjectId(bug.project_id || null)
        setDescription(bug.description || '')
        setEnvironment(bug.environment || '')
        setSeverity(bug.severity || 'medium')
        setStatus(bug.status || 'open')
        setStepsToReproduce(bug.steps_to_reproduce || '')
        setStackTrace(bug.stack_trace || '')
        setExpectedResult(bug.expected_result || '')
        setActualResult(bug.actual_result || '')
      } else {
        setTitle('')
        setProjectId(null)
        setDescription('')
        setEnvironment('')
        setSeverity('medium')
        setStatus('open')
        setStepsToReproduce('')
        setStackTrace('')
        setExpectedResult('')
        setActualResult('')
      }
      setPendingFiles([])
      setActiveTab('desc')
    }
  }, [show, bug])

  // Paste handler for screenshot
  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes('image')) {
        const file = items[i].getAsFile()
        if (file) {
          const preview = URL.createObjectURL(file)
          setPendingFiles((prev) => [...prev, { file, preview }])
          setActiveTab('attach')
          notify('Screenshot pasted and attached!', 'info')
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const uploadedAttachments: { file_path: string; file_name: string; file_type: string; file_size: number }[] = []

      // Upload pending files to Supabase Storage
      for (const item of pendingFiles) {
        const fileExt = item.file.name.split('.').pop() || 'png'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const { data, error } = await supabase.storage.from('bug-attachments').upload(fileName, item.file)
        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from('bug-attachments').getPublicUrl(data.path)
          uploadedAttachments.push({
            file_path: publicUrlData.publicUrl,
            file_name: item.file.name,
            file_type: item.file.type,
            file_size: item.file.size,
          })
        }
      }

      if (bug) {
        const updated = await updateBug(bug.id, {
          title,
          project_id: projectId,
          description,
          environment,
          severity,
          status,
          steps_to_reproduce: stepsToReproduce,
          stack_trace: stackTrace,
          expected_result: expectedResult,
          actual_result: actualResult,
          newAttachments: uploadedAttachments,
        })
        onSuccess(updated)
      } else {
        const created = await createBug({
          title,
          project_id: projectId,
          description,
          environment,
          severity,
          status,
          steps_to_reproduce: stepsToReproduce,
          stack_trace: stackTrace,
          expected_result: expectedResult,
          actual_result: actualResult,
          attachments: uploadedAttachments,
        })
        onSuccess(created)
      }
    } catch (err: any) {
      notify(err.message || 'Failed to save bug', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      onPaste={handlePaste}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white text-slate-900 dark:bg-zinc-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex-shrink-0">
              <Bug className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 truncate">
                {bug ? `Edit Bug #${bug.id}` : 'Report New Bug'}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-zinc-400 truncate">
                Paste screenshots anywhere with <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded border text-[10px]">Ctrl+V</kbd>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 no-scrollbar">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stripe webhook drops signature verification"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">Project</label>
              <select
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-200"
              >
                <option value="">No Project (General)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BugStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-200"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">Environment / Device</label>
              <input
                type="text"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="e.g. Chrome 124 / macOS / Production"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* Severity selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
              Severity Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {(['critical', 'high', 'medium', 'low'] as BugSeverity[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-2 px-2.5 sm:px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                    severity === lvl
                      ? 'ring-2 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500'
                      : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      lvl === 'critical'
                        ? 'bg-rose-500'
                        : lvl === 'high'
                        ? 'bg-amber-500'
                        : lvl === 'medium'
                        ? 'bg-indigo-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>{lvl}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-zinc-950/40">
            <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-950/80 text-xs overflow-x-auto pb-0.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('desc')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === 'desc'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Description</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('steps')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === 'steps'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Repro Steps</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stack')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === 'stack'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Stack Trace</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attach')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === 'attach'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900 font-semibold'
                    : 'border-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Screenshots ({pendingFiles.length + (bug?.attachments?.length || 0)})</span>
              </button>
            </div>

            <div className="p-3.5 sm:p-4">
              {activeTab === 'desc' && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setDescPreview(!descPreview)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Eye className="w-3 h-3" />
                      {descPreview ? 'Edit Raw' : 'Live Preview'}
                    </button>
                  </div>
                  {descPreview ? (
                    <div
                      className="p-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl min-h-[140px] text-xs prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(description || '*No description provided.*') as string) }}
                    />
                  ) : (
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what happened, error message, or context..."
                      className="w-full p-3 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none font-sans"
                    />
                  )}
                </div>
              )}

              {activeTab === 'steps' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Steps to Reproduce
                    </label>
                    <textarea
                      rows={3}
                      value={stepsToReproduce}
                      onChange={(e) => setStepsToReproduce(e.target.value)}
                      placeholder="1. Open checkout page&#10;2. Select payment method&#10;3. Click submit"
                      className="w-full p-2.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                        Expected Result
                      </label>
                      <textarea
                        rows={2}
                        value={expectedResult}
                        onChange={(e) => setExpectedResult(e.target.value)}
                        placeholder="Should complete without errors"
                        className="w-full p-2 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-zinc-400 mb-1">
                        Actual Result
                      </label>
                      <textarea
                        rows={2}
                        value={actualResult}
                        onChange={(e) => setActualResult(e.target.value)}
                        placeholder="Throws 500 server error"
                        className="w-full p-2 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stack' && (
                <div>
                  <textarea
                    rows={6}
                    value={stackTrace}
                    onChange={(e) => setStackTrace(e.target.value)}
                    placeholder="Paste error logs, exception stack traces, or code snippets here..."
                    className="w-full p-3 font-mono text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              )}

              {activeTab === 'attach' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-zinc-800 hover:border-indigo-500 rounded-2xl p-5 text-center cursor-pointer bg-white dark:bg-zinc-950/60 transition-colors"
                  >
                    <UploadCloud className="w-7 h-7 text-slate-400 dark:text-zinc-500 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Upload screenshot or press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-[10px]">Ctrl+V</kbd>
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">PNG, JPG, WebP up to 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files
                        if (files) {
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i]
                            const preview = URL.createObjectURL(file)
                            setPendingFiles((prev) => [...prev, { file, preview }])
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Attachment Thumbnails */}
                  {(pendingFiles.length > 0 || (bug?.attachments && bug.attachments.length > 0)) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {pendingFiles.map((p, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.preview} alt="preview" className="w-full h-20 sm:h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(p.preview)
                              setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                            }}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md text-[10px]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {bug?.attachments?.map((att) => (
                        <div key={att.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={att.file_path} alt={att.file_name} className="w-full h-20 sm:h-24 object-cover" />
                          <span className="absolute bottom-1 left-1 text-[9px] bg-slate-900/80 text-white px-1 rounded truncate max-w-[80%]">
                            {att.file_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-4 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? 'Saving...' : bug ? 'Save Changes' : 'Create Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BugDetailModal({
  show,
  bug,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onCopyAI,
  notify,
}: {
  show: boolean
  bug: BugItem
  onClose: () => void
  onEdit: (bug: BugItem) => void
  onDelete: (bug: BugItem) => void
  onStatusChange: (id: number, status: BugStatus) => void
  onCopyAI: (bug: BugItem) => void
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [copied, setCopied] = useState(false)

  function copyStackTrace() {
    if (!bug.stack_trace) return
    navigator.clipboard.writeText(bug.stack_trace)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notify('Stack trace copied to clipboard', 'success')
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white text-slate-900 dark:bg-zinc-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-mono text-xs sm:text-sm font-bold text-slate-400 dark:text-zinc-500">#{bug.id}</span>
            <span className="text-[10px] sm:text-xs uppercase font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
              {bug.severity}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onCopyAI(bug)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:hover:bg-violet-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 text-xs font-semibold transition-all active:scale-95"
              title="Copy prompt for AI coding agent"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Copy for AI</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit(bug)}
              className="p-2 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300"
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
              className="p-2 sm:p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 no-scrollbar">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-snug">{bug.title}</h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400">
              {bug.project && (
                <span className="font-semibold" style={{ color: bug.project.color || '#818cf8' }}>
                  {bug.project.name}
                </span>
              )}
              {bug.environment && <span>• {bug.environment}</span>}
              <span>• {new Date(bug.created_at || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Description */}
          {bug.description && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-2">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase text-slate-700 dark:text-zinc-300">Description</h4>
              <div
                className="text-xs prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(bug.description) as string) }}
              />
            </div>
          )}

          {/* Steps */}
          {bug.steps_to_reproduce && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-2">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase text-slate-700 dark:text-zinc-300">Steps to Reproduce</h4>
              <pre className="text-xs font-sans whitespace-pre-wrap text-slate-800 dark:text-zinc-200">
                {bug.steps_to_reproduce}
              </pre>
            </div>
          )}

          {/* Stack trace */}
          {bug.stack_trace && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] sm:text-xs font-mono uppercase text-indigo-400">Stack Trace / Code</h4>
                <button
                  type="button"
                  onClick={copyStackTrace}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono overflow-x-auto p-2.5 bg-slate-950 rounded-xl text-slate-300">
                {bug.stack_trace}
              </pre>
            </div>
          )}

          {/* Attachments */}
          {bug.attachments && bug.attachments.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-[11px] sm:text-xs font-bold uppercase text-slate-700 dark:text-zinc-300">Attachments</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {bug.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file_path}
                    target="_blank"
                    rel="noreferrer"
                    className="group block rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 relative bg-slate-100 dark:bg-zinc-950"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={att.file_path} alt={att.file_name} className="w-full h-28 sm:h-32 object-cover group-hover:scale-105 transition-transform" />
                    <div className="p-2 text-[10px] sm:text-[11px] truncate bg-white/90 dark:bg-zinc-900/90 text-slate-700 dark:text-zinc-300">
                      {att.file_name}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectManagerModal({
  show,
  projects,
  onClose,
  onProjectsChange,
  notify,
}: {
  show: boolean
  projects: Project[]
  onClose: () => void
  onProjectsChange: React.Dispatch<React.SetStateAction<Project[]>>
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [desc, setDesc] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsAdding(true)
    try {
      const created = await createProject({ name: name.trim(), color, description: desc.trim() || undefined })
      onProjectsChange((prev) => [...prev, created])
      setName('')
      setDesc('')
      setColor('#6366f1')
      onClose()
      notify(`Project "${created.name}" created successfully`, 'success')
    } catch (e: any) {
      notify(e.message || 'Failed to create project', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDeleteProject(id: number) {
    try {
      await deleteProject(id)
      onProjectsChange((prev) => prev.filter((p) => p.id !== id))
      notify('Project deleted', 'success')
    } catch (e: any) {
      notify(e.message || 'Failed to delete project', 'error')
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white text-slate-900 dark:bg-zinc-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 sm:space-y-6 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">Manage Projects</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Project Form */}
        <form onSubmit={handleAddProject} className="space-y-3 bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">Create New Project</h4>
          <div className="space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App v2, Payment Gateway..."
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 rounded-full border-0 p-0 bg-transparent cursor-pointer"
                />
                <span className="text-xs font-mono font-medium text-slate-700 dark:text-zinc-300 uppercase">{color}</span>
              </label>
              <button
                type="submit"
                disabled={isAdding}
                className="flex-1 py-2.5 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 text-center"
              >
                {isAdding ? 'Adding...' : 'Add Project'}
              </button>
            </div>
          </div>
        </form>

        {/* Existing Projects List */}
        <div className="space-y-2 overflow-y-auto max-h-56 pr-1 no-scrollbar">
          {projects.length === 0 ? (
            <p className="text-xs text-center py-6 text-slate-400 dark:text-zinc-500">No custom projects yet.</p>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color || '#818cf8' }} />
                  <span className="text-xs font-semibold truncate">{proj.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(proj.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
