'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Bug,
  ArrowLeft,
  Mail,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  LogOut,
  UserCheck,
  Calendar
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { logout, updateAccountEmail, updateAccountPassword } from '@/app/auth/actions'

interface AccountClientProps {
  userId: string
  userEmail: string
  createdAt?: string
}

export default function AccountClient({
  userId,
  userEmail,
  createdAt,
}: AccountClientProps) {
  const [email, setEmail] = useState(userEmail)
  const [currentEmailState, setCurrentEmailState] = useState(userEmail)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email || email === currentEmailState) return

    setIsUpdatingEmail(true)
    try {
      await updateAccountEmail(email)
      setCurrentEmailState(email)
      showToast('Email login berhasil diperbarui (atau cek email konfirmasi)', 'success')
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah email', 'error')
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password) return

    if (password.length < 6) {
      showToast('Kata sandi minimal 6 karakter', 'error')
      return
    }

    if (password !== confirmPassword) {
      showToast('Konfirmasi kata sandi tidak cocok', 'error')
      return
    }

    setIsUpdatingPassword(true)
    try {
      await updateAccountPassword(password, confirmPassword)
      setPassword('')
      setConfirmPassword('')
      showToast('Kata sandi berhasil diperbarui', 'success')
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah kata sandi', 'error')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white text-slate-900 dark:bg-zinc-900 dark:text-zinc-100 shadow-2xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30 transition-colors w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 flex-shrink-0">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                    Pengaturan Akun
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:block">
                    Kelola profil login dan kredensial keamanan Anda
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              <form action={logout}>
                <button
                  type="submit"
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 bg-white hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/30 rounded-lg border border-slate-200 dark:border-zinc-700/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Account Info Banner */}
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg flex-shrink-0">
              {currentEmailState ? currentEmailState.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 truncate">
                  {currentEmailState}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <UserCheck className="w-3 h-3" />
                  Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                ID: {userId}
              </p>
            </div>
          </div>
          {createdAt && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-mono bg-slate-50 dark:bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800/60 self-start sm:self-auto">
              <Calendar className="w-3.5 h-3.5" />
              <span>Bergabung {new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>

        {/* Form Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section: Ubah Email */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-zinc-800/60">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Ganti Email Login</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Email yang digunakan untuk masuk ke DevBug Tracker
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateEmail} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                    Email Baru
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingEmail || !email || email === currentEmailState}
                    className="w-full py-2.5 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingEmail ? 'Menyimpan...' : 'Perbarui Email'}
                  </button>
                </div>
              </form>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
              Catatan: Jika konfirmasi email aktif di Supabase, link verifikasi akan dikirimkan ke alamat email baru.
            </p>
          </div>

          {/* Section: Ubah Password */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-zinc-800/60">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Ganti Kata Sandi</h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Perbarui kata sandi untuk mengamankan akun Anda
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword || !password || !confirmPassword}
                    className="w-full py-2.5 px-4 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-600/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPassword ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/60">
              <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Pastikan kata sandi baru sulit ditebak dan tidak dibagikan ke siapapun.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
