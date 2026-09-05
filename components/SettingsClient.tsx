'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Key,
  Copy,
  Check,
  Trash2,
  X,
  Menu,
  Mail,
  KeyRound,
  Calendar,
  ShieldCheck,
  Cpu,
  Layers,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react'
import { createApiKey, deleteApiKey } from '@/app/settings/actions'
import { updateAccountEmail, updateAccountPassword } from '@/app/auth/actions'
import { ApiKey, Project, BugItem } from '@/types'
import { AppSidebar } from '@/components/AppSidebar'
import { Toast, ToastData, ToastType } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Logo } from '@/components/ui/Logo'
import { BugModal } from '@/components/bugs/BugModal'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

interface SettingsClientProps {
  userId?: string
  userEmail?: string
  createdAt?: string
  initialApiKeys: ApiKey[]
  projects?: Project[]
  bugs?: BugItem[]
  isGuest?: boolean
}

export default function SettingsClient({
  userId,
  userEmail,
  createdAt,
  initialApiKeys,
  projects = [],
  bugs = [],
  isGuest = false,
}: SettingsClientProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [clientProjects, setClientProjects] = useState<Project[]>(projects)
  const [clientBugs, setClientBugs] = useState<BugItem[]>(bugs)
  const [showBugModal, setShowBugModal] = useState(false)

  // API Key creation & visibility
  const [keyName, setKeyName] = useState('')
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [originUrl, setOriginUrl] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [sessionSecrets, setSessionSecrets] = useState<Record<string, string>>({})
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  // Account security
  const [email, setEmail] = useState(userEmail || '')
  const [currentEmailState, setCurrentEmailState] = useState(userEmail || '')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const [toast, setToast] = useState<ToastData | null>(null)

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin)

      // Muat persistent local API secrets ke sessionSecrets
      try {
        const storedSecrets = localStorage.getItem('devbug_local_api_secrets')
        if (storedSecrets) {
          setSessionSecrets(JSON.parse(storedSecrets))
        }
      } catch {
        // ignore
      }

      if (isGuest && initialApiKeys.length === 0) {
        const stored = localStorage.getItem('devbug_guest_api_keys')
        if (stored) {
          try {
            setApiKeys(JSON.parse(stored))
          } catch {
            // ignore
          }
        }
      }
    }
  }, [isGuest, initialApiKeys])

  useKeyboardShortcut('b', () => setShowBugModal((prev) => !prev))

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    if (!keyName.trim()) return

    setIsCreatingKey(true)
    try {
      if (isGuest) {
        const randHex = () => Math.random().toString(16).substring(2).padEnd(8, '0')
        const h1 = (randHex() + randHex()).slice(0, 16)
        const h2 = randHex().slice(0, 6)
        const h3 = randHex().slice(0, 8)
        const rawSecret = `devbug-${h1}-${h2}-${h3}`
        const newKey: ApiKey = {
          id: String(Date.now()),
          name: keyName.trim(),
          key_prefix: `devbug-${h1.slice(0, 4)}...`,
          raw_key: rawSecret,
          created_at: new Date().toISOString(),
          last_used_at: null,
        }
        const updated = [newKey, ...apiKeys]
        setApiKeys(updated)
        localStorage.setItem('devbug_guest_api_keys', JSON.stringify(updated))
        setCreatedSecret(rawSecret)
        setSessionSecrets((prev) => ({ ...prev, [newKey.id]: rawSecret }))
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('devbug_local_api_secrets')
            const secretMap = stored ? JSON.parse(stored) : {}
            secretMap[newKey.id] = rawSecret
            localStorage.setItem('devbug_local_api_secrets', JSON.stringify(secretMap))
          } catch {
            // ignore
          }
        }
        setKeyName('')
        showToast('API Key generated successfully (Guest Mode)', 'success')
      } else {
        const res = await createApiKey(keyName)
        const keyWithSecret: ApiKey = {
          ...res.apiKey,
          raw_key: res.rawSecret,
        }
        setApiKeys((prev) => [keyWithSecret, ...prev])
        setCreatedSecret(res.rawSecret)
        setSessionSecrets((prev) => ({ ...prev, [res.apiKey.id]: res.rawSecret }))
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('devbug_local_api_secrets')
            const secretMap = stored ? JSON.parse(stored) : {}
            secretMap[res.apiKey.id] = res.rawSecret
            localStorage.setItem('devbug_local_api_secrets', JSON.stringify(secretMap))
          } catch {
            // ignore
          }
        }
        setKeyName('')
        showToast('API Key generated successfully', 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create API key', 'error')
    } finally {
      setIsCreatingKey(false)
    }
  }

  async function handleConfirmRevoke() {
    if (!keyToRevoke) return
    setIsRevoking(true)
    const id = keyToRevoke.id

    try {
      if (isGuest) {
        const updated = apiKeys.filter((k) => k.id !== id)
        setApiKeys(updated)
        localStorage.setItem('devbug_guest_api_keys', JSON.stringify(updated))
        showToast('API Key revoked', 'info')
      } else {
        await deleteApiKey(id)
        setApiKeys((prev) => prev.filter((k) => k.id !== id))
        showToast('API Key revoked', 'info')
      }
      setKeyToRevoke(null)
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke API key', 'error')
    } finally {
      setIsRevoking(false)
    }
  }

  function copyToClipboard(text: string, label?: string) {
    navigator.clipboard.writeText(text)
    if (label) {
      setCopiedItem(label)
      setTimeout(() => setCopiedItem(null), 2000)
    } else {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
    showToast('Copied to clipboard!', 'success')
  }

  function toggleRevealKey(id: string) {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email || email === currentEmailState) return

    setIsUpdatingEmail(true)
    try {
      const res = await updateAccountEmail(email)
      showToast('Email updated successfully!', 'success')
      setCurrentEmailState(email)
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred while updating email', 'error')
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      showToast('Password cannot be empty', 'error')
      return
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    setIsUpdatingPassword(true)
    try {
      await updateAccountPassword(password)
      showToast('Password updated successfully!', 'success')
      setPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      showToast(err.message || 'An unexpected error occurred while updating password', 'error')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const apiEndpoint = `${originUrl || 'https://your-devbug-domain.com'}/api/v1/bugs`

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden font-sans">
      <AppSidebar
        projects={clientProjects}
        bugs={clientBugs}
        userEmail={userEmail}
        onNewBug={() => setShowBugModal(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Link
              href={isGuest ? '/' : '/project'}
              className="flex items-center justify-center"
            >
              <Logo size="sm" />
            </Link>
            <span className="font-bold text-sm tracking-tight">Settings</span>
          </div>
          <Link
            href={isGuest ? '/' : '/project'}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <Menu className="w-5 h-5" />
          </Link>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Settings & Integrations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Application Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Manage your API automation integration keys, AI agents, and account security preferences.
            </p>
          </div>

          {/* SECTION 1: API Keys & Integration */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-zinc-800">
              <Cpu className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                API Keys & Agent Integrations
              </h2>
            </div>

            {/* Warning when new key is created */}
            {createdSecret && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 relative animate-in fade-in slide-in-from-top-2 duration-300">
                <button
                  type="button"
                  onClick={() => setCreatedSecret(null)}
                  className="absolute top-3 right-3 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800"
                >
                  <X className="w-4 h-4" />
                </button>
                <h4 className="font-semibold text-sm flex items-center gap-1.5 mb-1">
                  <Check className="w-4 h-4 text-emerald-500" /> Key Generated Successfully!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-400 mb-3">
                  Copy this API Key now. For security reasons, you will not be able to view it again after closing this box.
                </p>
                <div className="flex items-center gap-2 max-w-xl">
                  <Input
                    readOnly
                    value={createdSecret}
                    className="font-mono text-xs bg-white dark:bg-zinc-900 border-emerald-500/30 text-emerald-900 dark:text-emerald-300 select-all"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(createdSecret)}
                    className="shrink-0 flex items-center gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Endpoint API Section */}
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    API Endpoint
                  </h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                  POST / PATCH
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Use this API endpoint URL to create or update bug statuses via AI agents or automation scripts.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-xs text-slate-700 dark:text-zinc-300 select-all overflow-x-auto">
                  {apiEndpoint}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
                  className="shrink-0 flex items-center gap-1.5 text-xs"
                >
                  {copiedItem === 'endpoint' ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedItem === 'endpoint' ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            {/* Unified API Keys Management Card */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs overflow-hidden">
              {/* Header & Create Form in One Section */}
              <div className="p-5 border-b border-slate-100 dark:border-zinc-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      Active API Keys & Generation
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Create and manage API authorization keys for syncing bugs via cURL or AI agents.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium self-start sm:self-auto">
                    {apiKeys.length} {apiKeys.length === 1 ? 'Key' : 'Keys'}
                  </span>
                </div>

                {/* Inline Create Form */}
                <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Input
                    placeholder="New key name (e.g. Claude Code, Cursor, CI/CD)..."
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    disabled={isCreatingKey}
                    className="text-xs flex-1"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isCreatingKey || !keyName.trim()}
                    className="shrink-0"
                  >
                    {isCreatingKey ? 'Generating...' : 'Generate Key'}
                  </Button>
                </form>
              </div>

              {/* List Active API Keys */}
              {apiKeys.length === 0 ? (
                <div className="p-8 text-center">
                  <Key className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    No active API Keys yet. Create a key in the form above to connect your AI agent.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {apiKeys.map((key) => {
                    const isRevealed = !!revealedKeys[key.id]
                    const sessionSecret = sessionSecrets[key.id] || key.raw_key
                    const isSecretAvailable = !!sessionSecret
                    const copyTarget = sessionSecret || key.raw_key || key.key_prefix

                    return (
                      <div
                        key={key.id}
                        className="p-4 space-y-2.5 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Baris 1: Judul Key */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100">
                            {key.name}
                          </span>
                        </div>

                        {/* Baris 2: API Key Prefix / Secret if in session sejajar dengan Actions (Eye, Copy, Revoke) */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-xs overflow-hidden">
                            {sessionSecret ? (
                              isRevealed ? (
                                <span className="text-slate-800 dark:text-zinc-200 select-all tracking-normal">
                                  {sessionSecret}
                                </span>
                              ) : (
                                <span className="text-slate-500 dark:text-zinc-400 select-none font-mono">
                                  devbug-********************************
                                </span>
                              )
                            ) : (
                              <span className="text-slate-700 dark:text-zinc-300 font-mono select-all">
                                {key.key_prefix}
                              </span>
                            )}
                          </div>

                          {sessionSecret && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRevealKey(key.id)}
                              className="h-8 px-2.5 text-slate-600 dark:text-zinc-400"
                              title={isRevealed ? 'Hide API Key' : 'Show API Key'}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}

                          {/* Tombol Salin */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(copyTarget, `key_${key.id}`)}
                            className="h-8 px-2.5 text-slate-600 dark:text-zinc-400"
                            title="Copy API Key"
                          >
                            {copiedItem === `key_${key.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          {/* Tombol Revoke */}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setKeyToRevoke(key)}
                            className="h-8 text-[11px] px-2.5 flex items-center gap-1.5 shrink-0"
                            title="Revoke API Key"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Revoke</span>
                          </Button>
                        </div>

                        {/* Baris 3: Metadata dibuat pada */}
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Created on{' '}
                          {new Date(key.created_at).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {key.last_used_at && (
                            <span> • Last used: {new Date(key.last_used_at).toLocaleDateString('en-US')}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: Account Profile & Security (Only for Logged-in Admin) */}
          {!isGuest ? (
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-zinc-800">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                  Account & Security
                </h2>
              </div>

              {/* Account Meta Info */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-base">
                    {(userEmail || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {userEmail}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      ID: {userId}
                    </p>
                  </div>
                </div>

                {createdAt && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Registered since {new Date(createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Forms Grid: Update Email & Update Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Update Email */}
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      Change Email
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Supabase will send a confirmation link to your new email address.
                  </p>

                  <form onSubmit={handleUpdateEmail} className="space-y-3">
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter new email address"
                      className="text-xs"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isUpdatingEmail || !email || email === currentEmailState}
                      className="w-full text-xs"
                    >
                      {isUpdatingEmail ? 'Saving...' : 'Save New Email'}
                    </Button>
                  </form>
                </div>

                {/* Form Update Password */}
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      Change Password
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Make sure your new password is at least 6 characters.
                  </p>

                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password (min. 6 characters)"
                      className="text-xs"
                    />
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="text-xs"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isUpdatingPassword || !password}
                      className="w-full text-xs"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </div>
              </div>
            </section>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-800 text-center space-y-2">
              <Layers className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                You are currently in Guest mode (local browser storage).
              </p>
              <Link
                href="/login"
                className="inline-block px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
              >
                Sign in as Admin
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Modal Konfirmasi Revoke API Key */}
      {keyToRevoke && (
        <ConfirmDialog
          show={!!keyToRevoke}
          title="Revoke API Key"
          description="This action cannot be undone. AI agents using this key will lose access."
          message={
            <span>
              Are you sure you want to revoke{' '}
              <strong className="font-semibold text-slate-900 dark:text-zinc-100">
                {keyToRevoke.name}
              </strong>
              ?
            </span>
          }
          confirmLabel="Revoke Key"
          variant="danger"
          isPending={isRevoking}
          onConfirm={handleConfirmRevoke}
          onClose={() => setKeyToRevoke(null)}
        />
      )}

      {/* In-place Bug Modal */}
      {showBugModal && (
        <BugModal
          show={showBugModal}
          bug={null}
          projects={clientProjects}
          isGuest={isGuest}
          onClose={() => setShowBugModal(false)}
          onSuccess={(newBug) => {
            setClientBugs((prev) => [newBug, ...prev])
            setShowBugModal(false)
            showToast('Bug created successfully', 'success')
          }}
          notify={(msg, type = 'success') => showToast(msg, type)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
