'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { BugItem, BugStatus, BugSeverity, Project } from '@/types'
import { bugInputSchema, projectInputSchema } from '@/lib/validations'

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

// BUG ACTIONS
export async function getBugs(filters?: {
  search?: string
  project_id?: string | null
  status?: string
  severity?: string
}) {
  const { supabase } = await requireAuth()
  let query = supabase
    .from('bug_items')
    .select(`
      *,
      project:projects(*),
      attachments(*)
    `)
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })

  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity)
  }
  if (filters?.search) {
    const s = `%${filters.search.trim()}%`
    query = query.or(`title.ilike.${s},description.ilike.${s},stack_trace.ilike.${s},fix_hint.ilike.${s}`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Database error in getBugs:', error.message)
    throw new Error('Failed to fetch bugs.')
  }
  return data as BugItem[]
}

export async function createBug(rawFormData: {
  title: string
  project_id: string
  description?: string | null
  environment?: string | null
  severity: BugSeverity
  status: BugStatus
  fix_hint?: string | null
  suspected_files?: string[] | null
  resolved_commit?: string | null
  steps_to_reproduce?: string | null
  stack_trace?: string | null
  expected_result?: string | null
  actual_result?: string | null
  attachments?: { file_path: string; file_name: string; file_type: string; file_size: number }[]
}) {
  const { supabase } = await requireAuth()

  const parsed = bugInputSchema.safeParse(rawFormData)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i: { message: string }) => i.message).join(', ')
    throw new Error(msg || 'Invalid bug data.')
  }

  const formData = parsed.data
  
  const insertPayload = {
    title: formData.title,
    project_id: formData.project_id,
    description: formData.description || null,
    environment: formData.environment || null,
    severity: formData.severity,
    status: formData.status,
    fix_hint: formData.fix_hint || null,
    suspected_files: formData.suspected_files || [],
    confirmed_files: formData.confirmed_files || [],
    investigation_state: formData.investigation_state || 'unconfirmed',
    reproduction_reliability: formData.reproduction_reliability || 'untested',
    root_cause: formData.root_cause || null,
    failed_attempts: formData.failed_attempts || [],
    branch_name: formData.branch_name || null,
    base_commit_sha: formData.base_commit_sha || null,
    resolved_commit: formData.resolved_commit || null,
    steps_to_reproduce: formData.steps_to_reproduce || null,
    stack_trace: formData.stack_trace || null,
    expected_result: formData.expected_result || null,
    actual_result: formData.actual_result || null,
    resolved_at: formData.status === 'resolved' ? new Date().toISOString() : null,
  }

  const { data: bug, error } = await supabase
    .from('bug_items')
    .insert(insertPayload)
    .select('*, project:projects(*), attachments(*)')
    .single()

  if (error) {
    console.error('Database error in createBug:', error.message)
    throw new Error('Failed to create bug.')
  }

  if (formData.attachments && formData.attachments.length > 0) {
    const attachRecords = formData.attachments.map(att => ({
      bug_item_id: bug.id,
      file_path: att.file_path,
      file_name: att.file_name,
      file_type: att.file_type,
      file_size: att.file_size,
    }))
    const { error: attachError } = await supabase.from('attachments').insert(attachRecords)
    if (attachError) {
      console.error('Failed to attach files:', attachError.message)
    }
  }

  revalidatePath('/')
  return bug
}

export async function updateBug(
  id: string,
  rawFormData: {
    title: string
    project_id: string
    description?: string | null
    environment?: string | null
    severity: BugSeverity
    status: BugStatus
    fix_hint?: string | null
    suspected_files?: string[] | null
    resolved_commit?: string | null
    steps_to_reproduce?: string | null
    stack_trace?: string | null
    expected_result?: string | null
    actual_result?: string | null
    newAttachments?: { file_path: string; file_name: string; file_type: string; file_size: number }[]
  }
) {
  const { supabase } = await requireAuth()

  const parsed = bugInputSchema.safeParse(rawFormData)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i: { message: string }) => i.message).join(', ')
    throw new Error(msg || 'Invalid bug data.')
  }

  const formData = parsed.data

  const updatePayload: Record<string, any> = {
    title: formData.title,
    project_id: formData.project_id,
    description: formData.description || null,
    environment: formData.environment || null,
    severity: formData.severity,
    status: formData.status,
    fix_hint: formData.fix_hint || null,
    suspected_files: formData.suspected_files || [],
    confirmed_files: formData.confirmed_files || [],
    investigation_state: formData.investigation_state || 'unconfirmed',
    reproduction_reliability: formData.reproduction_reliability || 'untested',
    root_cause: formData.root_cause || null,
    failed_attempts: formData.failed_attempts || [],
    branch_name: formData.branch_name || null,
    base_commit_sha: formData.base_commit_sha || null,
    resolved_commit: formData.resolved_commit || null,
    steps_to_reproduce: formData.steps_to_reproduce || null,
    stack_trace: formData.stack_trace || null,
    expected_result: formData.expected_result || null,
    actual_result: formData.actual_result || null,
    updated_at: new Date().toISOString(),
  }

  if (formData.status === 'resolved') {
    updatePayload.resolved_at = new Date().toISOString()
  } else {
    updatePayload.resolved_at = null
  }

  const { data: bug, error } = await supabase
    .from('bug_items')
    .update(updatePayload)
    .eq('id', id)
    .select('*, project:projects(*), attachments(*)')
    .single()

  if (error) {
    console.error('Database error in updateBug:', error.message)
    throw new Error('Failed to update bug.')
  }

  if (formData.newAttachments && formData.newAttachments.length > 0) {
    const attachRecords = formData.newAttachments.map(att => ({
      bug_item_id: id,
      file_path: att.file_path,
      file_name: att.file_name,
      file_type: att.file_type,
      file_size: att.file_size,
    }))
    const { error: attachError } = await supabase.from('attachments').insert(attachRecords)
    if (attachError) {
      console.error('Failed to attach files:', attachError.message)
    }
  }

  revalidatePath('/')
  return bug
}

export async function updateBugStatus(id: string, status: BugStatus) {
  const { supabase } = await requireAuth()
  const payload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'resolved') {
    payload.resolved_at = new Date().toISOString()
  } else {
    payload.resolved_at = null
  }

  const { error } = await supabase
    .from('bug_items')
    .update(payload)
    .eq('id', id)

  if (error) {
    console.error('Database error in updateBugStatus:', error.message)
    throw new Error('Failed to update status.')
  }
  revalidatePath('/')
}

export async function deleteBug(id: string) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('bug_items').delete().eq('id', id)
  if (error) {
    console.error('Database error in deleteBug:', error.message)
    throw new Error('Failed to delete bug.')
  }
  revalidatePath('/')
}

// PROJECT ACTIONS
export async function getProjects() {
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Database error in getProjects:', error.message)
    throw new Error('Failed to fetch projects.')
  }
  return data as Project[]
}

export async function createProject(rawFormData: {
  name: string
  color?: string
  description?: string | null
  repository_url?: string | null
  tech_stack?: string[] | null
  package_manager?: string | null
  test_command?: string | null
}) {
  const { supabase } = await requireAuth()

  const parsed = projectInputSchema.safeParse(rawFormData)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i: { message: string }) => i.message).join(', ')
    throw new Error(msg || 'Invalid project data.')
  }

  const formData = parsed.data

  let baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!baseSlug) {
    baseSlug = 'project'
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: formData.name,
      slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
      color: formData.color || '#6366f1',
      description: formData.description || null,
      repository_url: formData.repository_url || null,
      tech_stack: formData.tech_stack || [],
      package_manager: formData.package_manager || 'npm',
      test_command: formData.test_command || 'npm test',
    })
    .select()
    .single()

  if (error) {
    console.error('Database error in createProject:', error.message)
    throw new Error('Failed to create project.')
  }
  revalidatePath('/')
  return data
}

export async function updateProject(id: string, rawFormData: {
  name: string
  color?: string
  description?: string | null
  repository_url?: string | null
  tech_stack?: string[] | null
  package_manager?: string | null
  test_command?: string | null
}) {
  const { supabase } = await requireAuth()

  const parsed = projectInputSchema.safeParse(rawFormData)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i: { message: string }) => i.message).join(', ')
    throw new Error(msg || 'Invalid project data.')
  }

  const formData = parsed.data

  const { data, error } = await supabase
    .from('projects')
    .update({
      name: formData.name,
      color: formData.color || '#6366f1',
      description: formData.description || null,
      repository_url: formData.repository_url || null,
      tech_stack: formData.tech_stack || [],
      package_manager: formData.package_manager || 'npm',
      test_command: formData.test_command || 'npm test',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Database error in updateProject:', error.message)
    throw new Error('Failed to update project.')
  }
  revalidatePath('/')
  return data
}

export async function getProjectByUuid(idOrUuid: string) {
  const { supabase } = await requireAuth()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', idOrUuid)
    .single()

  if (error || !data) {
    return null
  }
  return data as Project
}

export async function deleteProject(id: string) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) {
    console.error('Database error in deleteProject:', error.message)
    throw new Error('Failed to delete project.')
  }
  revalidatePath('/')
}
