'use client'

import React, { useState } from 'react'
import { Key, Copy, Check, Terminal, Bot, ArrowRight, ExternalLink } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createApiKey } from '@/app/settings/actions'
import { ApiKey } from '@/types'
import Link from 'next/link'

interface ApiKeyPromptModalProps {
  show: boolean
  onClose: () => void
  onKeyCreated: (key: ApiKey) => void
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
  isGuest?: boolean
}

export function ApiKeyPromptModal({
  show,
  onClose,
  onKeyCreated,
  notify,
  isGuest = false,
}: ApiKeyPromptModalProps) {
  const [name, setName] = useState('Claude Code CLI')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      if (isGuest) {
        const randHex = () => Math.random().toString(16).substring(2).padEnd(8, '0')
        const h1 = (randHex() + randHex()).slice(0, 16)
        const h2 = randHex().slice(0, 6)
        const h3 = randHex().slice(0, 8)
        const rawSecret = `devbug-${h1}-${h2}-${h3}`
        const newKey: ApiKey = {
          id: String(Date.now()),
          name: name.trim(),
          key_prefix: `devbug-${h1.slice(0, 4)}...`,
          created_at: new Date().toISOString(),
          last_used_at: null,
        }
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('devbug_guest_api_keys')
            const list = stored ? JSON.parse(stored) : []
            localStorage.setItem('devbug_guest_api_keys', JSON.stringify([newKey, ...list]))
          } catch {
            // ignore
          }
        }
        setCreatedSecret(rawSecret)
        onKeyCreated(newKey)
        notify('API Key created successfully!', 'success')
      } else {
        const res = await createApiKey(name.trim())
        setCreatedSecret(res.rawSecret)
        onKeyCreated(res.apiKey)
        notify('API Key created successfully!', 'success')
      }
    } catch (err: any) {
      notify(err.message || 'Failed to create API key', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function copySecret() {
    if (!createdSecret) return
    navigator.clipboard.writeText(createdSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    notify('Secret copied to clipboard!', 'success')
  }

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Setup Your AI Agent API Key"
      description="Connect your AI coding agent (Claude Code, Cursor, Windsurf) to DevBug Tracker"
      icon={<Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      maxWidthClass="max-w-lg"
    >
      <div className="p-5 space-y-4">
        {!createdSecret ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
              <p className="font-semibold text-slate-800 dark:text-zinc-200">
                No API Key registered yet.
              </p>
              <p className="leading-relaxed">
                DevBug Tracker is purpose-built for AI coding agents to inspect bug dossiers, logs, and automatically mark issues resolved.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Key Label / Agent Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Claude Code Agent, Cursor Composer"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium py-2 px-3 rounded-lg transition"
              >
                Maybe Later
              </button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                <Key className="w-4 h-4 mr-1.5" />
                <span>Generate API Key</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Secret API Key Generated
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-semibold">
                  Copy Now
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Save this key now. The secret key is only displayed once for security reasons.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdSecret}
                  className="flex-1 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg font-mono text-xs border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 select-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={copySecret}
                  className="border-emerald-300 dark:border-emerald-800"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/settings"
                onClick={onClose}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View API Keys & Sync guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button type="button" variant="primary" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
