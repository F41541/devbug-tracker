'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    throw new Error('Kata sandi minimal 6 karakter.')
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    throw new Error('Konfirmasi kata sandi tidak cocok.')
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
