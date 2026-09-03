'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Copy, Check, Bot, Zap, Key } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { BugItem, Project, ApiKey } from '@/types'
import { generateBulkAIPrompt } from '@/lib/ai-prompt'

interface CopyAgentPromptModalProps {
  show: boolean
  onClose: () => void
  bugs: BugItem[]
  project?: Project | null
  apiKeys?: ApiKey[]
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function CopyAgentPromptModal({
  show,
  onClose,
  bugs,
  project,
  apiKeys = [],
  notify,
}: CopyAgentPromptModalProps) {
  const [copied, setCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [selectedKey, setSelectedKey] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const promptText = generateBulkAIPrompt(bugs, project, {
    baseUrl: baseUrl || 'http://localhost:3000',
    apiKey: selectedKey || undefined,
  })

  function handleCopy() {
    navigator.clipboard.writeText(promptText)
    setCopied(true)
    notify('Task prompt copied! Paste into your AI coding agent.', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
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

        {/* Optional API Key Input / Selector */}
        {apiKeys.length > 0 && (
          <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>Authorize Agent via API Key (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Paste your devbug_sec_... key (or leave empty if using local agent)"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs ${
                      copied
                        ? 'bg-emerald-500 text-white border border-emerald-600'
                        : 'bg-white/90 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                    }`}
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
                  The agent will fire curl triggers at start and upon completion. Your dashboard cards update in real time.
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
  )
}
