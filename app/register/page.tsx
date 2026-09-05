'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Bug,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react'
import { requestRegistration, verifyRegistrationOtp, resendRegistrationOtp } from '@/app/auth/actions'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/InputOTP'

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [email, setEmail] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isResending, startResendTransition] = useTransition()

  // Realtime password validation checks
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const isPasswordValid = hasMinLength && hasUppercase && hasSpecialChar

  // Realtime confirm password check
  const hasConfirmInput = confirmPassword.length > 0
  const isConfirmMatch = hasConfirmInput && password === confirmPassword

  const isFormValid = email.includes('@') && isPasswordValid && isConfirmMatch

  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isFormValid) return
    setError(null)
    setSuccessMessage(null)
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    formData.append('confirmPassword', confirmPassword)

    startTransition(async () => {
      const result = await requestRegistration(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.success && result.email) {
        setRegisteredEmail(result.email)
        setStep('verify')
        setSuccessMessage(`A verification code has been sent to ${result.email}`)
      }
    })
  }

  async function handleVerifySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await verifyRegistrationOtp(otpCode)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl
      }
    })
  }

  async function handleResendCode() {
    setError(null)
    setSuccessMessage(null)

    startResendTransition(async () => {
      const result = await resendRegistrationOtp()
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccessMessage('A new verification code has been sent to your email.')
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
            {step === 'form' ? 'Create DevBug Tracker Account' : 'Verify Your Email'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {step === 'form'
              ? 'Start tracking bugs and connecting autonomous AI agents'
              : `Enter the 6-digit verification code sent to ${registeredEmail}`}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'form' ? (
          /* Step 1: Form Registrasi */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <Input
                label="Developer Email"
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                icon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Realtime Password Rules Checklist (Only shown when typing & no box) */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1 text-[11px] px-0.5">
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasMinLength
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-zinc-700" />
                    )}
                    <span>At least 8 characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasUppercase
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {hasUppercase ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-zinc-700" />
                    )}
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      hasSpecialChar
                        ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {hasSpecialChar ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-zinc-700" />
                    )}
                    <span>At least 1 special character (!@#$%...)</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                icon={<KeyRound className="w-4 h-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Realtime Confirm Password Status */}
              {hasConfirmInput && (
                <div
                  className={`mt-1.5 text-[11px] flex items-center gap-1.5 font-medium transition-colors ${
                    isConfirmMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  {isConfirmMatch ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              disabled={!isFormValid || isPending}
              className="w-full py-2.5 mt-2"
            >
              <span>Send Verification Code</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Already have an account? Sign in here</span>
              </Link>
            </div>
          </form>
        ) : (
          /* Step 2: Form Input OTP */
          <form onSubmit={handleVerifySubmit} className="space-y-5">
            <div className="space-y-3 text-center">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                6-Digit Verification Code
              </label>

              {/* Shadcn style OTP Slots (3 - 3) */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(val) => setOtpCode(val)}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {/* Spam Folder Notice */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                Can&apos;t find the email? Please check your <strong className="font-semibold">Spam / Junk</strong> folder or wait a few seconds before requesting a new code.
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              disabled={otpCode.length !== 6}
              className="w-full py-2.5"
            >
              <span>Verify & Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline transition font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

