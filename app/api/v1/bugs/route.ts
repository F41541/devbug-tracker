import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const xApiKey = req.headers.get('x-api-key')
  let rawKey = xApiKey

  if (!rawKey && authHeader?.startsWith('Bearer ')) {
    rawKey = authHeader.substring(7).trim()
  }

  if (!rawKey) return null

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const supabase = createAdminClient()

  const { data: keyRecord, error } = await supabase
    .from('api_keys')
    .select('id, name, user_id')
    .eq('key_hash', keyHash)
    .single()

  if (error || !keyRecord) return null

  try {
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id)
  } catch (err) {
    console.error('Failed to update API key last_used_at:', err)
  }

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

  // Fetch accessible projects owned by the API key creator
  const { data: userProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', keyRecord.user_id)

  const allowedProjectIds = (userProjects || []).map((p) => p.id)
  if (allowedProjectIds.length === 0) {
    return NextResponse.json({
      authenticated_as: keyRecord.name,
      count: 0,
      bugs: [],
    })
  }

  let resolvedProjectId = projectId

  // If workspace ID provided, resolve project ID
  if (workspaceId && !resolvedProjectId) {
    const { data: proj } = await supabase
      .from('projects')
      .select('id')
      .eq('id', workspaceId)
      .eq('user_id', keyRecord.user_id)
      .single()
    if (proj) {
      resolvedProjectId = String(proj.id)
    } else {
      return NextResponse.json({ error: `Workspace with ID ${workspaceId} not found or unauthorized.` }, { status: 404 })
    }
  }

  if (resolvedProjectId && !allowedProjectIds.includes(resolvedProjectId)) {
    return NextResponse.json({ error: 'Unauthorized: Project does not belong to this API key.' }, { status: 403 })
  }

  let query = supabase
    .from('bug_items')
    .select('*, project:projects(*)')
    .in('project_id', resolvedProjectId ? [resolvedProjectId] : allowedProjectIds)
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
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

    // Verify the bug belongs to a project owned by the API key user
    const { data: targetBug, error: fetchBugErr } = await supabase
      .from('bug_items')
      .select('id, project_id, project:projects(user_id)')
      .eq('id', id)
      .single()

    if (fetchBugErr || !targetBug) {
      return NextResponse.json({ error: 'Bug not found.' }, { status: 404 })
    }

    const bugOwnerId = (targetBug.project as any)?.user_id
    if (bugOwnerId !== keyRecord.user_id) {
      return NextResponse.json({ error: 'Unauthorized: Bug does not belong to your account.' }, { status: 403 })
    }

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

    if (updateFields.failed_attempt) {
      const { data: currentBug } = await supabase
        .from('bug_items')
        .select('failed_attempts')
        .eq('id', id)
        .single()

      const priorAttempts = Array.isArray(currentBug?.failed_attempts)
        ? currentBug.failed_attempts
        : []

      patchPayload.failed_attempts = [
        ...priorAttempts,
        {
          timestamp: new Date().toISOString(),
          agent: keyRecord.name || 'DevBug Agent',
          hypothesis: updateFields.failed_attempt.hypothesis || 'Attempted fix',
          files_modified: updateFields.failed_attempt.files_modified || [],
          failure_reason: updateFields.failed_attempt.failure_reason || 'Unknown reason',
        },
      ]
    }

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
