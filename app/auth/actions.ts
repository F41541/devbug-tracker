'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendVerificationEmail } from '@/lib/mailer'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

const OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'devbug-otp-secret-key-salt'

function generateRegistrationToken(email: string, code: string, password: string,expiresAt: number): string {
  const data = JSON.stringify({ email, code, password, exp: expiresAt })
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    crypto.createHash('sha256').update(OTP_SECRET).digest(),
    Buffer.alloc(12, 0)
  )
  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag().toString('hex')
  return `${encrypted}.${tag}`
}

function verifyRegistrationToken(token: string): { email: string; code: string; password: string; exp: number } | null {
  try {
    const [encrypted, tag] = token.split('.')
    if (!encrypted || !tag) return null

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      crypto.createHash('sha256').update(OTP_SECRET).digest(),
      Buffer.alloc(12, 0)
    )
    decipher.setAuthTag(Buffer.from(tag, 'hex'))
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    const parsed = JSON.parse(decrypted)

    if (Date.now() > parsed.exp) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export async function requestRegistration(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!email || !email.includes('@')) {
    return { error: 'Invalid email address.' }
  }

  const hasMinLength = password && password.length >= 8
  const hasUppercase = /[A-Z]/.test(password || '')
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password || '')

  if (!hasMinLength || !hasUppercase || !hasSpecialChar) {
    return {
      error:
        'Password must be at least 8 characters, containing at least 1 uppercase letter and 1 special character.',
    }
  }

  if (confirmPassword && password !== confirmPassword) {
    return { error: 'Password confirmation does not match.' }
  }

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

  try {
    // Send email via Gmail SMTP
    await sendVerificationEmail(email, otpCode)
  } catch (err: any) {
    console.error('SMTP Email send failure:', err)
    return { error: `Failed to send verification email: ${err.message || 'Please check your SMTP configuration.'}` }
  }

  // Simpan token payload terenkripsi di HTTP-only cookie
  const token = generateRegistrationToken(email, otpCode, password, expiresAt)
  const cookieStore = await cookies()
  cookieStore.set('devbug_reg_pending', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 menit
    path: '/',
  })

  return { success: true, email }
}

export async function verifyRegistrationOtp(code: string) {
  const cleanCode = code?.trim()
  if (!cleanCode || cleanCode.length !== 6) {
    return { error: 'Please enter the 6-digit verification code.' }
  }

  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('devbug_reg_pending')

  if (!tokenCookie || !tokenCookie.value) {
    return { error: 'Verification session expired. Please register again.' }
  }

  const payload = verifyRegistrationToken(tokenCookie.value)
  if (!payload) {
    return { error: 'Invalid or expired code. Please try again.' }
  }

  if (payload.code !== cleanCode) {
    return { error: 'Incorrect verification code. Please check your inbox again.' }
  }

  // Create or confirm user in Supabase
  const adminSupabase = createAdminClient()
  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  })

  if (createError) {
    if (createError.message.includes('already registered')) {
      return { error: 'This email is already registered. Please log in directly.' }
    }
    return { error: createError.message }
  }

  // Delete pending cookie
  cookieStore.delete('devbug_reg_pending')

  // Sign in user directly
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (signInError) {
    return { success: true, redirectUrl: '/login' }
  }

  redirect('/')
}

export async function resendRegistrationOtp() {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('devbug_reg_pending')

  if (!tokenCookie || !tokenCookie.value) {
    return { error: 'Registration session expired. Please enter your details again.' }
  }

  const payload = verifyRegistrationToken(tokenCookie.value)
  if (!payload) {
    return { error: 'Registration session expired.' }
  }

  const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = Date.now() + 10 * 60 * 1000

  try {
    await sendVerificationEmail(payload.email, newOtpCode)
  } catch (err: any) {
    return { error: `Failed to resend email: ${err.message}` }
  }

  const newToken = generateRegistrationToken(payload.email, newOtpCode, payload.password, expiresAt)
  cookieStore.set('devbug_reg_pending', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return { success: true, email: payload.email }
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updateAccountEmail(newEmail: string) {
  if (!newEmail || !newEmail.trim()) {
    throw new Error('Email baru tidak boleh kosong.')
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase.auth.updateUser({
    email: newEmail.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true, email: data.user?.email }
}

export async function updateAccountPassword(newPassword: string, confirmPassword?: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters.')
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    throw new Error('Password confirmation does not match.')
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
