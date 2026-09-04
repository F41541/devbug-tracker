'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Copy, Check, Bot, Zap, Key, Plus, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { BugItem, Project, ApiKey } from '@/types'
import { generateBulkAIPrompt } from '@/lib/ai-prompt'
import { ApiKeyPromptModal } from '@/components/integrations/ApiKeyPromptModal'

interface CopyAgentPromptModalProps {
  show: boolean
  onClose: () => void
  bugs: BugItem[]
  project: Project | null
  projectNumberMap?: Map<string, number>
  apiKeys?: ApiKey[]
  onKeyCreated?: (key: ApiKey) => void
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
  isGuest?: boolean
}

export function CopyAgentPromptModal({
  show,
  onClose,
  bugs,
  project,
  projectNumberMap,
  apiKeys = [],
  onKeyCreated,
  notify,
  isGuest = false,
}: CopyAgentPromptModalProps) {
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [currentApiKeys, setCurrentApiKeys] = useState<ApiKey[]>(apiKeys)
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    setCurrentApiKeys(apiKeys)
  }, [apiKeys])

  // Cari key aktif default dari session atau list prefix
  useEffect(() => {
    if (currentApiKeys.length > 0) {
      const activeSecret = currentApiKeys[0].raw_key || currentApiKeys[0].key_prefix
      setSelectedKey(activeSecret)
    } else {
      setSelectedKey('')
    }
  }, [currentApiKeys])

  const hasApiKey = !!selectedKey && selectedKey.trim().length > 0

  const promptText = generateBulkAIPrompt(bugs, project, {
    baseUrl: baseUrl || 'http://localhost:3000',
    apiKey: selectedKey || undefined,
    projectNumberMap,
  })

  function handleCopy() {
    if (!hasApiKey) {
      setShowCreateKeyModal(true)
      notify('API Key is required! Please generate an API Key first.', 'error')
      return
    }

    navigator.clipboard.writeText(promptText)
    setCopied(true)
    notify('Task prompt copied! Paste into your AI coding agent.', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleNewKeyCreated(newKey: ApiKey) {
    setCurrentApiKeys((prev) => [newKey, ...prev])
    if (newKey.raw_key) {
      setSelectedKey(newKey.raw_key)
    } else {
      setSelectedKey(newKey.key_prefix)
    }
    if (onKeyCreated) {
      onKeyCreated(newKey)
    }
    setShowCreateKeyModal(false)
    notify('API Key successfully created and linked to prompt!', 'success')
  }

  return (
    <>
      <Modal
        show={show}
        onClose={onClose}
        title="Send Task to AI Coding Agent"
        description={`Generate autonomous prompt with live sync triggers for ${bugs.length} issue${bugs.length > 1 ? 's' : ''}`}
        icon={<Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
        maxWidthClass="max-w-2xl"
      >
        <div className="p-4 sm:p-5 space-y-3.5 max-h-[calc(85vh-70px)] overflow-y-auto no-scrollbar">
          {/* Realtime Sync Highlight Banner */}
          <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Live Realtime Sync
              </p>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400/90 leading-relaxed">
                When executed, the AI agent runs background terminal triggers to auto-update bug status to <strong className="font-semibold">In Progress</strong> and <strong className="font-semibold">Resolved</strong> directly on this board.
              </p>
            </div>
          </div>

          {/* Mandatory API Key Indicator / Selector */}
          {!hasApiKey ? (
            <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    API Key Required
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    You do not have an active API Key. Create an API Key now to copy and synchronize prompts.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setShowCreateKeyModal(true)}
                className="shrink-0 flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create API Key</span>
              </Button>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                    Authorized via API Key
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono truncate">
                    {selectedKey.slice(0, 15)}************************
                  </p>
                </div>
              </div>
              {currentApiKeys.length > 1 && (
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className="text-xs font-mono px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200"
                >
                  {currentApiKeys.map((k) => (
                    <option key={k.id} value={k.raw_key || k.key_prefix}>
                      {k.name} ({k.key_prefix.slice(0, 10)}...)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Tutorial Steps - Vertical List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              <span>Instructions:</span>
            </h4>

            <div className="space-y-2">
              {/* Step 1 with prompt box directly underneath */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    1
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                      Copy Task Prompt
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Copy the XML prompt with embedded sync commands to your clipboard:
                    </p>
                  </div>
                </div>

                {/* Fixed Height Text Container with inside copy button and white background */}
                <div className="relative rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
                  <div className="absolute top-2 right-2 z-10">
                    <button
                      type="button"
                      onClick={handleCopy}
                      disabled={!hasApiKey}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs ${
                        !hasApiKey
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 border border-slate-200 dark:border-zinc-800 cursor-not-allowed opacity-60'
                          : copied
                            ? 'bg-emerald-500 text-white border border-emerald-600'
                            : 'bg-white/90 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                      }`}
                      title={!hasApiKey ? 'Please create an API Key first to copy prompt' : 'Copy Prompt'}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="h-36 overflow-y-auto p-3 pr-24 text-[11px] font-mono leading-relaxed text-slate-800 dark:text-zinc-200 select-all whitespace-pre">
                    {promptText}
                  </pre>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  2
                </span>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                    Paste into AI Agent (Claude Code / Cursor / Windsurf)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Open terminal or composer inside your target code repository, paste the prompt, and let the agent work.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  3
                </span>
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">
                    Watch Live Sync in Browser
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    The agent will run <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 font-mono text-[10px]">npx devbug start</code> and <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 font-mono text-[10px]">npx devbug resolve</code> CLI commands. Your dashboard cards update in real time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="primary"
              onClick={onClose}
            >
              <span>Done</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Embedded Create API Key Modal if none exists */}
      {showCreateKeyModal && (
        <ApiKeyPromptModal
          show={showCreateKeyModal}
          onClose={() => setShowCreateKeyModal(false)}
          onKeyCreated={handleNewKeyCreated}
          notify={notify}
          isGuest={isGuest}
        />
      )}
    </>
  )
}

