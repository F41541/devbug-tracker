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
    notify('Prompt berhasil disalin ke clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyAndClose() {
    handleCopy()
    setTimeout(() => {
      onClose()
    }, 400)
  }

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Kirim Task ke AI Coding Agent"
      description={`Salin prompt dossier investigasi untuk ${bugs.length} bug di project ${project?.name || ''}`}
      icon={<Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      maxWidthClass="max-w-2xl"
    >
      <div className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-80px)] overflow-y-auto no-scrollbar">
        {/* Tutorial Steps */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-indigo-500" />
            <span>Panduan Langkah-Langkah:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Salin Teks
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Klik tombol <strong>Salin Prompt</strong> di kotak dossier di bawah ini.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Buka AI Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Buka terminal atau editor: <code>claude</code>, Cursor Composer, Roo Code, dll.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Paste & Jalankan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Tempel (Paste) teks prompt ke agent. Agent langsung investigasi & memperbaiki bug.
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Height Text Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              <span>Prompt XML Dossier ({bugs.length} Issues)</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              icon={copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            >
              <span>{copied ? 'Tersalin!' : 'Salin Prompt'}</span>
            </Button>
          </div>

          <div className="relative rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-slate-950 shadow-inner">
            <pre className="h-52 overflow-y-auto p-3.5 text-[11px] font-mono leading-relaxed text-emerald-400 select-all whitespace-pre">
              {promptText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium py-2 px-3 rounded-lg transition"
          >
            Tutup
          </button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCopyAndClose}
            icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            <span>{copied ? 'Tersalin!' : 'Salin & Tutup'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
