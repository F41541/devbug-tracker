'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bug,
  FolderGit2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Bot,
  Terminal,
  Sparkles,
  CheckCircle2,
  Layers,
  Key,
} from 'lucide-react'
import { Project, BugItem } from '@/types'
import { AppSidebar } from '@/components/AppSidebar'
import { BugModal } from '@/components/bugs/BugModal'
import { KanbanView, ListView } from '@/components/bugs'
import { Toast, ToastData, ToastType } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

interface HomeClientProps {
  initialProjects: Project[]
  initialBugs: BugItem[]
  userEmail?: string
  isGuest?: boolean
}

export function HomeClient({
  initialProjects,
  initialBugs,
  userEmail,
  isGuest = false,
}: HomeClientProps) {
  const router = useRouter()
  const [projects] = useState<Project[]>(initialProjects)
  const [bugs, setBugs] = useState<BugItem[]>(initialBugs)
  const [showScratchpadModal, setShowScratchpadModal] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load guest scratchpad from local browser storage
  useEffect(() => {
    if (isGuest && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('local_devbug_items')
        if (saved) {
          setBugs(JSON.parse(saved))
        }
      } catch (e) {
        console.error('Failed to parse local scratchpad', e)
      }
    }
  }, [isGuest])

  // Save guest scratchpad
  useEffect(() => {
    if (isGuest && typeof window !== 'undefined') {
      try {
        localStorage.setItem('local_devbug_items', JSON.stringify(bugs))
      } catch (e) {
        console.error('Failed to save local scratchpad', e)
      }
    }
  }, [bugs, isGuest])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex selection:bg-indigo-500 selection:text-white transition-colors">
      <Toast toast={toast} />

      {/* Sidebar */}
      <AppSidebar
        projects={projects}
        bugs={bugs}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Navbar */}
        <header className="border-b border-slate-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20 transition-colors w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-zinc-100">
            <Bug className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>DevBug Tracker</span>
            <span className="text-slate-400 font-normal hidden sm:inline">• Beranda</span>
          </div>

          <div className="flex items-center gap-2">
            {isGuest ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition"
              >
                <span>Sign In to Admin</span>
              </Link>
            ) : (
              <Link
                href="/project"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs transition"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Go to Projects Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </header>

        {/* Hero & Quick Access */}
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Welcome Hero Banner */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-900/90 via-slate-900 to-zinc-950 text-white border border-indigo-800/40 shadow-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-mono border border-indigo-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI-First Bug Dossier Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {isGuest ? 'Welcome to DevBug Scratchpad' : 'Welcome back to DevBug Admin'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isGuest
                ? 'Capture bugs quickly into browser offline storage, or sign in to access project workspaces and the Model Context Protocol (MCP) server for coding agents.'
                : 'Manage isolated workspaces with persistent UUIDs, track technical investigation states, and sync bug dossiers with your AI agent.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowScratchpadModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                <span>Record New Bug</span>
              </Button>

              {!isGuest && (
                <Link
                  href="/project"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition flex items-center gap-1.5"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>View All Projects ({projects.length})</span>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Workspaces Grid (for logged-in user) */}
          {!isGuest && projects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Active Project Workspaces
                </h3>
                <Link
                  href="/project"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  View all →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {projects.slice(0, 6).map((proj) => {
                  const projBugsCount = bugs.filter(
                    (b) => b.project_id === proj.id && b.status !== 'resolved' && b.status !== 'closed'
                  ).length

                  return (
                    <Link
                      key={proj.id}
                      href={`/project/${proj.uuid}`}
                      className="group p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: proj.color || '#6366f1' }}
                          />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 transition truncate">
                            {proj.name}
                          </h4>
                        </div>
                        {proj.description && (
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80 mt-3 text-[11px]">
                        <span className="font-mono text-slate-400">
                          {projBugsCount} active {projBugsCount === 1 ? 'issue' : 'issues'}
                        </span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                          Open Kanban →
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Scratchpad / Recent Issues Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {isGuest ? 'Local Offline Scratchpad' : 'Recent Global Issues'}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {bugs.length} total
              </span>
            </div>

            {bugs.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-2">
                <Bug className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                  No issues recorded yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Use the button below to capture a bug report with error logs and screenshots.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScratchpadModal(true)}
                  className="mt-2"
                >
                  Create Bug
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {bugs.slice(0, 10).map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[10px]">#{b.id}</span>
                        <span className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {b.title}
                        </span>
                      </div>
                      {b.environment && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 block truncate mt-0.5">
                          {b.environment}
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] uppercase font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex-shrink-0">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bug Modal */}
      {showScratchpadModal && (
        <BugModal
          show={showScratchpadModal}
          bug={null}
          projects={
            isGuest
              ? [
                  {
                    id: 999999,
                    uuid: 'local-scratchpad',
                    name: 'Local Scratchpad',
                    slug: 'local-scratchpad',
                    color: '#6366f1',
                  },
                ]
              : projects
          }
          selectedProjectId={projects[0]?.id || 999999}
          isGuest={isGuest}
          onClose={() => setShowScratchpadModal(false)}
          onSuccess={(saved) => {
            setShowScratchpadModal(false)
            setBugs((prev) => [saved, ...prev])
            showToast('Bug saved successfully!', 'success')
          }}
          notify={showToast}
        />
      )}
    </div>
  )
}
