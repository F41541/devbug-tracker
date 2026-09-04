'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ApiKey } from '@/types'
import crypto from 'crypto'

async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return { supabase, user }
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const { supabase, user } = await requireAuth()
  
  // 1. Coba query dengan filter user_id
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_at, last_used_at')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('created_at', { ascending: false })

  if (!error && data) {
    return data as ApiKey[]
  }

  // 2. Graceful fallback jika database remote belum sempat dieksekusi migrasi kolom user_id
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_at, last_used_at')
    .order('created_at', { ascending: false })

  if (fallbackError) {
    console.error('Failed to fetch API keys:', fallbackError.message)
    return []
  }

  return (fallbackData || []) as ApiKey[]
}

export async function createApiKey(name: string): Promise<{ apiKey: ApiKey; rawSecret: string }> {
  const { supabase, user } = await requireAuth()
  if (!name || !name.trim()) {
    throw new Error('API Key name is required.')
  }

  // Generate format: devbug-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxx (total 39 chars)
  const hex1 = crypto.randomBytes(8).toString('hex') // 16 chars
  const hex2 = crypto.randomBytes(3).toString('hex') // 6 chars
  const hex3 = crypto.randomBytes(4).toString('hex') // 8 chars
  const rawSecret = `devbug-${hex1}-${hex2}-${hex3}`
  const keyPrefix = `devbug-${hex1.slice(0, 4)}...`
  
  const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex')

  // 1. Coba insert dengan user_id
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select('id, name, key_prefix, created_at, last_used_at')
    .single()

  if (!error && data) {
    revalidatePath('/settings')
    return {
      apiKey: data as ApiKey,
      rawSecret,
    }
  }

  // 2. Graceful fallback jika tabel belum punya kolom user_id
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('api_keys')
    .insert({
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select('id, name, key_prefix, created_at, last_used_at')
    .single()

  if (fallbackError) {
    console.error('Failed to create API key:', fallbackError.message)
    throw new Error('Failed to create API key: ' + fallbackError.message)
  }

  revalidatePath('/settings')
  return {
    apiKey: fallbackData as ApiKey,
    rawSecret,
  }
}

export async function deleteApiKey(id: string) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('api_keys').delete().eq('id', id)
  if (error) {
    console.error('Failed to delete API key:', error.message)
    throw new Error('Failed to delete API key.')
  }
  revalidatePath('/settings')
}
