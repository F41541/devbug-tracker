'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { Lock, Mail, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react'
import { login } from '@/app/auth/actions'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/ui/Logo'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50 dark:bg-zinc-950 transition-colors">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center">
            <Logo size="xl" className="shadow-lg shadow-indigo-600/20" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            DevBug Tracker
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Developer Admin Portal
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                required
                placeholder="admin@devbug.io"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="123456"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>
          </div>

          {process.env.NODE_ENV !== 'production' && (
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-[11px] text-slate-500 dark:text-zinc-400 flex flex-col gap-0.5">
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                Default Admin Credentials (Dev Only):
              </span>
              <span>
                Email: <code className="font-mono text-indigo-600 dark:text-indigo-400">admin@devbug.io</code>
              </span>
              <span>
                Password: <code className="font-mono text-indigo-600 dark:text-indigo-400">123456</code>
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Don&apos;t have an account? Register now</span>
            </Link>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Restricted to Authorized Developer Only</span>
        </div>
      </div>
    </div>
  )
}
