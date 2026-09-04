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
import { BugModal } from '@/components/bugs/BugModal'

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

  // Persistent map for full secrets in this browser
  const [persistentSecrets, setPersistentSecrets] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('devbug_local_api_secrets')
        if (stored) {
          setPersistentSecrets(JSON.parse(stored))
        }
      } catch {
        // ignore
      }
    }
  }, [])
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault()
        setShowBugModal((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
        setPersistentSecrets((prev) => {
          const next = { ...prev, [newKey.id]: rawSecret }
          localStorage.setItem('devbug_local_api_secrets', JSON.stringify(next))
          return next
        })
        setKeyName('')
        showToast('API Key generated successfully (Guest Mode)', 'success')
      } else {
        const res = await createApiKey(keyName)
        setApiKeys((prev) => [res.apiKey, ...prev])
        setCreatedSecret(res.rawSecret)
        setSessionSecrets((prev) => ({ ...prev, [res.apiKey.id]: res.rawSecret }))
        setPersistentSecrets((prev) => {
          const next = { ...prev, [res.apiKey.id]: res.rawSecret }
          localStorage.setItem('devbug_local_api_secrets', JSON.stringify(next))
          return next
        })
        setKeyName('')
        showToast('API Key generated successfully', 'success')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create API key', 'error')
    } finally {
      setIsCreatingKey(false)
    }
  }

  async function handleDeleteKey(id: string) {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return
    }

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
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke API key', 'error')
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
              className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm"
            >
              DB
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
              Kelola kunci integrasi API automation, agen AI, dan preferensi akun keamanan Anda.
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
                  Salin API Key ini sekarang. Demi alasan keamanan, Anda tidak akan dapat melihatnya lagi setelah menutup kotak ini.
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
                Gunakan URL endpoint ini untuk membuat atau memperbarui status bug via AI agent atau script automation.
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
                  <span>{copiedItem === 'endpoint' ? 'Tersalin' : 'Salin'}</span>
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
                      Buat dan kelola kunci otorisasi API untuk sinkronisasi bug via cURL atau agen AI.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-medium self-start sm:self-auto">
                    {apiKeys.length} {apiKeys.length === 1 ? 'Key' : 'Keys'}
                  </span>
                </div>

                {/* Inline Create Form */}
                <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-3 pt-1">
                  <Input
                    placeholder="Nama kunci baru (misal: Claude Code, Cursor, CI/CD)..."
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
                    {isCreatingKey ? 'Membuat...' : 'Generate Key'}
                  </Button>
                </form>
              </div>

              {/* List Active API Keys */}
              {apiKeys.length === 0 ? (
                <div className="p-8 text-center">
                  <Key className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    Belum ada API Key aktif. Buat kunci di form atas untuk menghubungkan agen AI.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {apiKeys.map((key) => {
                    const isRevealed = !!revealedKeys[key.id]
                    // Prioritaskan raw_key dari database, sessionSecrets, atau persistentSecrets local storage
                    const fullSecret =
                      key.raw_key ||
                      persistentSecrets[key.id] ||
                      sessionSecrets[key.id] ||
                      key.key_prefix.replace(/\.\.\.$/, '')
                    const copyTarget =
                      key.raw_key ||
                      persistentSecrets[key.id] ||
                      sessionSecrets[key.id] ||
                      key.key_prefix

                    return (
                      <div
                        key={key.id}
                        className="p-4 space-y-2.5 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Baris 1: Judul Key & Revoke */}
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100">
                            {key.name}
                          </span>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteKey(key.id)}
                            className="text-[11px] h-7 px-2.5 flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Revoke</span>
                          </Button>
                        </div>

                        {/* Baris 2: API Key dengan format sensor devbug-********************************, unmask tampilkan semua 39 karakter */}
                        <div className="flex items-center gap-2 max-w-xl">
                          <div className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 font-mono text-xs overflow-hidden">
                            {isRevealed ? (
                              <span className="text-slate-800 dark:text-zinc-200 select-all tracking-normal">
                                {fullSecret}
                              </span>
                            ) : (
                              <span className="text-slate-500 dark:text-zinc-400 select-none font-mono">
                                devbug-********************************
                              </span>
                            )}
                          </div>

                          {/* Tombol Mata (Toggle Reveal) */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRevealKey(key.id)}
                            className="h-8 px-2.5 text-slate-600 dark:text-zinc-400"
                            title={isRevealed ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          {/* Tombol Salin */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(copyTarget, `key_${key.id}`)}
                            className="h-8 px-2.5 text-slate-600 dark:text-zinc-400"
                            title="Salin API Key"
                          >
                            {copiedItem === `key_${key.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>

                        {/* Baris 3: Metadata dibuat pada */}
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Dibuat pada{' '}
                          {new Date(key.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {key.last_used_at && (
                            <span> • Terakhir dipakai: {new Date(key.last_used_at).toLocaleDateString('id-ID')}</span>
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
            <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-zinc-800">
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
                      Terdaftar sejak {new Date(createdAt).toLocaleDateString('id-ID', {
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
                      Ubah Email
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Supabase akan mengirimkan email konfirmasi ke alamat email baru Anda.
                  </p>

                  <form onSubmit={handleUpdateEmail} className="space-y-3">
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan alamat email baru"
                      className="text-xs"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isUpdatingEmail || !email || email === currentEmailState}
                      className="w-full text-xs"
                    >
                      {isUpdatingEmail ? 'Menyimpan...' : 'Simpan Email Baru'}
                    </Button>
                  </form>
                </div>

                {/* Form Update Password */}
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      Ganti Password
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Pastikan password baru Anda minimal 6 karakter.
                  </p>

                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password baru (min. 6 karakter)"
                      className="text-xs"
                    />
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Konfirmasi password baru"
                      className="text-xs"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isUpdatingPassword || !password}
                      className="w-full text-xs"
                    >
                      {isUpdatingPassword ? 'Memperbarui...' : 'Perbarui Password'}
                    </Button>
                  </form>
                </div>
              </div>
            </section>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-dashed border-slate-300 dark:border-zinc-800 text-center space-y-2">
              <Layers className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                Anda berada di mode Guest (penyimpanan lokal).
              </p>
              <Link
                href="/login"
                className="inline-block px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition"
              >
                Login sebagai Admin
              </Link>
            </div>
          )}
        </main>
      </div>

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
