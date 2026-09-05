'use client'

import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const InputOTP = React.forwardRef<
  React.ComponentRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      'flex items-center gap-2 has-disabled:opacity-50',
      containerClassName
    )}
    className={cn('disabled:cursor-not-allowed', className)}
    {...props}
  />
))
InputOTP.displayName = 'InputOTP'

const InputOTPGroup = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-1.5', className)} {...props} />
))
InputOTPGroup.displayName = 'InputOTPGroup'

const InputOTPSlot = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex h-12 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-base font-bold font-mono text-slate-900 transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100',
        isActive && 'z-10 border-indigo-500 ring-2 ring-indigo-500/30 dark:border-indigo-500 dark:ring-indigo-500/30',
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-px animate-caret-blink bg-indigo-600 duration-1000 dark:bg-indigo-400" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTPSeparator = React.forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" className="text-slate-300 dark:text-zinc-700" {...props}>
    <Minus className="w-4 h-4" />
  </div>
))
InputOTPSeparator.displayName = 'InputOTPSeparator'

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
