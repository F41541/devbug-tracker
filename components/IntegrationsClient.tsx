'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Key,
  Copy,
  Check,
  Trash2,
  Terminal,
  Sparkles,
  Server,
  X,
  Menu,
} from 'lucide-react'
import { createApiKey, deleteApiKey } from '@/app/integrations/actions'
import { ApiKey, Project, BugItem } from '@/types'
import { AppSidebar } from '@/components/AppSidebar'
import { Toast, ToastData, ToastType } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface IntegrationsClientProps {
  initialApiKeys: ApiKey[]
  userEmail?: string
  projects?: Project[]
  bugs?: BugItem[]
  isGuest?: boolean
}

export default function IntegrationsClient({
  initialApiKeys,
  userEmail,
  projects = [],
  bugs = [],
  isGuest = false,
}: IntegrationsClientProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [clientProjects, setClientProjects] = useState<Project[]>(projects)
  const [clientBugs, setClientBugs] = useState<BugItem[]>(bugs)
  const [keyName, setKeyName] = useState('')
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [originUrl, setOriginUrl] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin)

      // Fallback local storage for guest
      if (isGuest) {
        const localProject: Project = {
          id: 999999,
          uuid: 'local-scratchpad',
          name: 'Local Scratchpad',
          slug: 'local-scratchpad',
          description: 'Offline local-first bug notes stored only in this browser.',
          color: '#6366f1',
        }
        setClientProjects([localProject])

        try {
          const savedBugs = localStorage.getItem('local_devbug_items')
          if (savedBugs) {
            setClientBugs(JSON.parse(savedBugs))
          }
        } catch (e) {
          console.error('Failed to read local bugs in integrations', e)
        }
      }
    }
  }, [isGuest])

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    if (isGuest) {
      showToast('Please sign in as admin to create live API keys.', 'error')
      return
    }
    if (!keyName.trim()) return

    setIsCreatingKey(true)
    try {
      const res = await createApiKey(keyName.trim())
      setApiKeys((prev) => [res.apiKey, ...prev])
      setCreatedSecret(res.rawSecret)
      setKeyName('')
      showToast('API Key generated! Copy your secret now.', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to generate API Key', 'error')
    } finally {
      setIsCreatingKey(false)
    }
  }

  async function handleDeleteKey(id: number) {
    if (isGuest) {
      showToast('Only authenticated admins can revoke API keys.', 'error')
      return
    }
    try {
      await deleteApiKey(id)
      setApiKeys((prev) => prev.filter((k) => k.id !== id))
      showToast('API Key revoked successfully', 'info')
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke API Key', 'error')
    }
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text)
    if (label === 'secret') {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedConfig(label)
      setTimeout(() => setCopiedConfig(null), 2000)
    }
    showToast(`Copied to clipboard!`, 'success')
  }

  const activeApiKeyPlaceholder =
    createdSecret || (apiKeys.length > 0 ? `${apiKeys[0].key_prefix}` : 'YOUR_DEVBUG_API_KEY')

  const selectedProjectUuid = projects[0]?.uuid || 'YOUR_WORKSPACE_UUID'

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        devbug: {
          command: 'node',
          args: ['bin/mcp-server.mjs'],
          env: {
            DEVBUG_BASE_URL: originUrl || 'http://localhost:3000',
            DEVBUG_API_KEY: activeApiKeyPlaceholder,
            DEVBUG_WORKSPACE_ID: selectedProjectUuid,
          },
        },
      },
    },
    null,
    2
  )

  const curlExample = `curl -X POST "${originUrl || 'http://localhost:3000'}/api/v1/bugs" \\
  -H "Authorization: Bearer ${activeApiKeyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Uncaught TypeError: cannot read undefined",
    "severity": "high",
    "project_id": 1,
    "description": "Stack trace error log here..."
  }'`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* App Sidebar Component */}
      <AppSidebar projects={clientProjects} bugs={clientBugs} userEmail={userEmail} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Navbar */}
        <header className="border-b border-slate-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20 transition-colors w-full">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="lg:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
                >
                  <Menu className="w-4 h-4" />
                </Link>
                <div className="flex items-center gap-2 text-xs">
                  <Link
                    href={isGuest ? '/' : '/project'}
                    className="font-bold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 transition"
                  >
                    Projects
                  </Link>
                  <span className="text-slate-300 dark:text-zinc-600">/</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-100">
                    MCP & Agent Integrations
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Hero Section */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  AI Agent & CLI Integrations
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-2xl">
                Connect Claude Code, Roo Code, Antigravity, or custom CI scripts to automate bug
                reporting and ticket context retrieval.
              </p>
            </div>
          </div>

          {/* Modal: Secret View Banner when created */}
          {createdSecret && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2.5 animate-scale-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  Your New API Key Secret (Copy Now - Won&apos;t Be Shown Again!)
                </span>
                <button
                  type="button"
                  onClick={() => setCreatedSecret(null)}
                  className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={createdSecret}
                  className="flex-1 px-3 py-1.5 font-mono text-xs bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 select-all"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => copyText(createdSecret, 'secret')}
                  icon={copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  className="bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                >
                  {copiedKey ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API Keys Management */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>API Keys</span>
                  </h4>
                  <span className="text-xs font-mono text-slate-400">{apiKeys.length} Keys</span>
                </div>

                <form onSubmit={handleCreateKey} className="flex gap-2">
                  <Input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Key description (e.g. Claude Code Desktop)"
                    className="flex-1"
                  />
                  <Button type="submit" variant="primary" loading={isCreatingKey}>
                    Create
                  </Button>
                </form>

                {/* API Keys List */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {apiKeys.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-400">
                      No API keys created yet.
                    </div>
                  ) : (
                    apiKeys.map((k) => (
                      <div
                        key={k.id}
                        className="p-2.5 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                            {k.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate">
                            Prefix: {k.key_prefix}••••
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* REST API & cURL Example */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>cURL / REST API Snippet</span>
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyText(curlExample, 'curl')}
                    icon={copiedConfig === 'curl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  >
                    <span>{copiedConfig === 'curl' ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>

                <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-48">
                  {curlExample}
                </pre>

                {/* Model Context Protocol Quick Config */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5" />
                      Claude Code / Antigravity MCP Config
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyText(mcpConfigJson, 'mcp_box')}
                      icon={copiedConfig === 'mcp_box' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    >
                      <span>{copiedConfig === 'mcp_box' ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  <pre className="p-2.5 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-36">
                    {mcpConfigJson}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
