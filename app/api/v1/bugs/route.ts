import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

async function authenticateApiKey(req: NextRequest) {
  const isLocalDev =
    req.nextUrl.hostname === 'localhost' ||
    req.nextUrl.hostname === '127.0.0.1' ||
    req.nextUrl.hostname === '::1'

  const authHeader = req.headers.get('authorization')
  const xApiKey = req.headers.get('x-api-key')
  let rawKey = xApiKey

  if (!rawKey && authHeader?.startsWith('Bearer ')) {
    rawKey = authHeader.substring(7).trim()
  }

  // Local development bypass if no key provided
  if (!rawKey && isLocalDev) {
    return { id: 0, name: 'Local Dev Agent' }
  }

  if (!rawKey) return null

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const supabase = createAdminClient()

  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select('id, name')
    .eq('key_hash', keyHash)
    .single()

  if (error || !keyRecord) return null

  // Update last_used_at asynchronously
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)
    .then()

  return keyRecord
}

export async function GET(req: NextRequest) {
  const keyRecord = await authenticateApiKey(req)
  if (!keyRecord) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing API key.' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'open'
  const projectId = searchParams.get('project_id')
  const workspaceId = searchParams.get('workspace_id') || searchParams.get('project_uuid')

  const supabase = createAdminClient()

  let resolvedProjectId = projectId

  // If workspace ID provided, resolve project ID
  if (workspaceId && !resolvedProjectId) {
    const { data: proj } = await supabase
      .from('projects')
      .select('id')
      .eq('id', workspaceId)
      .single()
    if (proj) {
      resolvedProjectId = String(proj.id)
    } else {
      return NextResponse.json({ error: `Workspace with ID ${workspaceId} not found.` }, { status: 404 })
    }
  }

  let query = supabase
    .from('bug_items')
    .select('*, project:projects(*)')
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }
  if (resolvedProjectId) {
    query = query.eq('project_id', resolvedProjectId)
  }

  const { data: bugs, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    authenticated_as: keyRecord.name,
    count: bugs?.length || 0,
    bugs,
  })
}

export async function PATCH(req: NextRequest) {
  const keyRecord = await authenticateApiKey(req)
  if (!keyRecord) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing API key.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: 'Bug id is required.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const allowedFields = [
      'status',
      'investigation_state',
      'reproduction_reliability',
      'suspected_files',
      'confirmed_files',
      'root_cause',
      'failed_attempts',
      'branch_name',
      'base_commit_sha',
      'resolved_commit',
      'fix_hint',
    ]

    const patchPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    allowedFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        patchPayload[field] = updateFields[field]
      }
    })

    if (patchPayload.status === 'resolved') {
      patchPayload.resolved_at = new Date().toISOString()
    }

    const { data: updatedBug, error } = await supabase
      .from('bug_items')
      .update(patchPayload)
      .eq('id', id)
      .select('*, project:projects(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Bug #${id} context successfully updated by AI agent.`,
      bug: updatedBug,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid JSON body.' }, { status: 400 })
  }
}
