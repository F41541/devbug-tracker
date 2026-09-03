'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  KeyRound,
  Calendar,
  Menu,
} from 'lucide-react'
import { updateAccountEmail, updateAccountPassword } from '@/app/auth/actions'
import { AppSidebar } from '@/components/AppSidebar'
import { Toast, ToastData, ToastType } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Project, BugItem } from '@/types'

interface AccountClientProps {
  userId: string
  userEmail: string
  createdAt?: string
  projects?: Project[]
  bugs?: BugItem[]
}

export default function AccountClient({
  userId,
  userEmail,
  createdAt,
  projects = [],
  bugs = [],
}: AccountClientProps) {
  const [email, setEmail] = useState(userEmail)
  const [currentEmailState, setCurrentEmailState] = useState(userEmail)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const [toast, setToast] = useState<ToastData | null>(null)

  function showToast(message: string, type: ToastType = 'success') {
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Toast Notification */}
      <Toast toast={toast} />

      {/* App Sidebar Component */}
      <AppSidebar projects={projects} bugs={bugs} userEmail={userEmail} />

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
                    href="/project"
                    className="font-bold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 transition"
                  >
                    Projects
                  </Link>
                  <span className="text-slate-300 dark:text-zinc-600">/</span>
                  <span className="font-bold text-slate-900 dark:text-zinc-100">
                    Pengaturan Akun
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* User Overview Profile Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">
                  {userEmail}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate">
                  ID: {userId}
                </p>
              </div>
            </div>

            {createdAt && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-zinc-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Terdaftar sejak {new Date(createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Update Email Section */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Ubah Email Login
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Ganti alamat email utama yang digunakan untuk masuk ke dashboard ini.
                </p>

                <form onSubmit={handleUpdateEmail} className="space-y-3 pt-2">
                  <Input
                    label="Alamat Email Baru"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className="w-4 h-4" />}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    loading={isUpdatingEmail}
                    disabled={email === currentEmailState}
                    className="w-full"
                  >
                    Simpan Perubahan Email
                  </Button>
                </form>
              </div>
            </div>

            {/* Update Password Section */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Ubah Kata Sandi
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Pastikan akun Anda tetap aman dengan menggunakan kata sandi yang kuat.
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2">
                  <Input
                    label="Kata Sandi Baru"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                  />

                  <Input
                    label="Konfirmasi Kata Sandi Baru"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    loading={isUpdatingPassword}
                    disabled={!password || !confirmPassword}
                    className="w-full"
                  >
                    Perbarui Kata Sandi
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
