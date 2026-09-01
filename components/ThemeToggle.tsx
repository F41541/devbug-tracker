'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg border border-slate-200 dark:border-zinc-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
    </button>
  )
}
