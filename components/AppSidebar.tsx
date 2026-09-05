'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bug,
  Plus,
  FolderGit2,
  Bot,
  Settings,
  LogOut,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/ui/Logo'
import { logout } from '@/app/auth/actions'
import { Project, BugItem } from '@/types'

interface AppSidebarProps {
  projects?: Project[]
  bugs?: BugItem[]
  userEmail?: string
  viewLevel?: 'projects_hub' | 'workspace'
  selectedProject?: string | null
  onSelectProject?: (id: string | null) => void
  onNewBug?: () => void
  onManageProjects?: () => void
  onRequireAuth?: (featureName?: string) => void
}

export function AppSidebar({
  projects = [],
  bugs = [],
  userEmail,
  viewLevel = 'projects_hub',
  selectedProject = null,
  onSelectProject,
  onNewBug,
  onManageProjects,
  onRequireAuth,
}: AppSidebarProps) {
  const pathname = usePathname()
  const isRoot = pathname === '/'
  const isGuest = !userEmail

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 bg-white dark:bg-zinc-900/90 border-r border-slate-200/90 dark:border-zinc-800/80 backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
        {isRoot && onSelectProject ? (
          <div
            onClick={() => onSelectProject(null)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <Logo size="lg" className="shadow-md shadow-indigo-600/10 group-hover:scale-105 transition-transform" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                DevBug Tracker
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Solo Dev Bug Fix</p>
            </div>
          </div>
        ) : (
          <Link href={isGuest ? '/' : '/project'} className="flex items-center gap-2.5 group">
            <Logo size="lg" className="shadow-md shadow-indigo-600/10 group-hover:scale-105 transition-transform" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                DevBug Tracker
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Solo Dev Bug Fix</p>
            </div>
          </Link>
        )}
        <ThemeToggle />
      </div>

      {/* Action Button: New Bug */}
      <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80">
        {onNewBug ? (
          <button
            type="button"
            onClick={onNewBug}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Bug</span>
            <kbd className="px-1.5 py-0.5 bg-indigo-700/60 rounded text-[9px] font-mono ml-auto">
              Ctrl+Shift+B
            </kbd>
          </button>
        ) : (
          <Link
            href={isGuest ? '/' : '/project'}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Bug</span>
            <kbd className="px-1.5 py-0.5 bg-indigo-700/60 rounded text-[9px] font-mono ml-auto">
              Ctrl+Shift+B
            </kbd>
          </Link>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Main Navigation */}
        <div className="space-y-1">
          {isRoot && onSelectProject ? (
            <button
              type="button"
              onClick={() => onSelectProject(null)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                viewLevel === 'projects_hub'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderGit2 className="w-4 h-4 text-indigo-500" />
                <span>All Projects</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                {projects.length}
              </span>
            </button>
          ) : (
            <Link
              href={isGuest ? '/' : '/project'}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                pathname === '/project' || (isGuest && pathname === '/')
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderGit2 className="w-4 h-4 text-indigo-500" />
                <span>All Projects</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                {projects.length}
              </span>
            </Link>
          )}
        </div>

        {/* Projects List */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2.5 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Projects
            </span>
          </div>
          {projects.map((proj) => {
            const active =
              (isRoot && viewLevel === 'workspace' && selectedProject === proj.id) ||
              (!isRoot && pathname === `/project/${proj.id}`)
            const projBugsCount = bugs.filter(
              (b) => b.project_id === proj.id && b.status !== 'resolved' && b.status !== 'closed'
            ).length

            if (onSelectProject) {
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onSelectProject(proj.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: proj.color || '#6366f1' }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                    {projBugsCount}
                  </span>
                </button>
              )
            }

            const href = isGuest
              ? `/?project=${proj.id}`
              : `/project/${proj.id}`

            return (
              <Link
                key={proj.id}
                href={href}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color || '#6366f1' }} />
                  <span className="truncate">{proj.name}</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                  {projBugsCount}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Tools & Config */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-2.5 mb-1.5">
            Tools & Config
          </div>
          {isGuest && onRequireAuth ? (
            <button
              type="button"
              onClick={() => onRequireAuth('Settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                pathname === '/settings'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Settings</span>
            </button>
          ) : (
            <Link
              href="/settings"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                pathname === '/settings'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Settings</span>
            </Link>
          )}
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
        {isGuest ? (
          <div className="w-full flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">Guest Mode</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Local Browser Storage</p>
            </div>
            <Link
              href="/login"
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shadow-xs transition"
            >
              Sign In / Login
            </Link>
          </div>
        ) : (
          <>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{userEmail || 'Admin User'}</p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Online</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </aside>
  )
}
