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
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_at, last_used_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch API keys:', error.message)
    return []
  }

  return data as ApiKey[]
}

export async function createApiKey(name: string): Promise<{ apiKey: ApiKey; rawSecret: string }> {
  const { supabase } = await requireAuth()
  if (!name || !name.trim()) {
    throw new Error('API Key name is required.')
  }

  // Generate a cryptographically secure key: devbug_live_<32 hex>
  const randomBytes = crypto.randomBytes(24).toString('hex')
  const rawSecret = `devbug_sec_${randomBytes}`
  const keyPrefix = rawSecret.slice(0, 15) + '...'
  
  // Hash the secret with SHA-256 for secure DB storage
  const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex')

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select('id, name, key_prefix, created_at, last_used_at')
    .single()

  if (error) {
    console.error('Failed to create API key:', error.message)
    throw new Error('Failed to create API key: ' + error.message)
  }

  revalidatePath('/integrations')
  return {
    apiKey: data as ApiKey,
    rawSecret,
  }
}

export async function deleteApiKey(id: number) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('api_keys').delete().eq('id', id)
  if (error) {
    console.error('Failed to delete API key:', error.message)
    throw new Error('Failed to delete API key.')
  }
  revalidatePath('/integrations')
}
