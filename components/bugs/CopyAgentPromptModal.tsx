'use client'

import React, { useState } from 'react'
import { Sparkles, Copy, Check, Terminal, ArrowRight, Bot } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { BugItem, Project } from '@/types'
import { generateBulkAIPrompt } from '@/lib/ai-prompt'

interface CopyAgentPromptModalProps {
  show: boolean
  onClose: () => void
  bugs: BugItem[]
  project?: Project | null
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function CopyAgentPromptModal({
  show,
  onClose,
  bugs,
  project,
  notify,
}: CopyAgentPromptModalProps) {
  const [copied, setCopied] = useState(false)

  const promptText = generateBulkAIPrompt(bugs)

  function handleCopy() {
    navigator.clipboard.writeText(promptText)
    setCopied(true)
    notify('Prompt copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Send Task to AI Coding Agent"
      description={`Copy XML investigation dossier for ${bugs.length} issues in project ${project?.name || ''}`}
      icon={<Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      maxWidthClass="max-w-2xl"
    >
      <div className="p-4 sm:p-5 space-y-3.5 max-h-[calc(85vh-70px)] overflow-y-auto no-scrollbar">
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
                    Copy Prompt Text
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Copy the XML bug investigation dossier below to your clipboard:
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
                        <span>Copy</span>
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
                  Open AI Coding Agent in Terminal / Editor
                </span>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Open your repository in terminal or IDE, then run <code>claude</code>, Cursor Composer, Windsurf, or Roo Code.
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
                  Paste & Execute
                </span>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Paste the prompt into your AI agent session. The agent will read anchors, inspect negative knowledge, and fix issues autonomously.
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
            <span>Close</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
