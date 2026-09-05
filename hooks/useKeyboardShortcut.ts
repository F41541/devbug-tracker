'use client'

import { useEffect } from 'react'

interface ShortcutOptions {
  ctrlOrMeta?: boolean
  shift?: boolean
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = { ctrlOrMeta: true, shift: true }
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const matchCtrlMeta = options.ctrlOrMeta ? e.ctrlKey || e.metaKey : true
      const matchShift = options.shift ? e.shiftKey : true

      if (matchCtrlMeta && matchShift && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, options.ctrlOrMeta, options.shift])
}
