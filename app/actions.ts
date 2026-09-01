'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { BugItem, BugStatus, BugSeverity, Project } from '@/types'

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
  project_id?: number | null
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
    query = query.or(`title.ilike.${s},description.ilike.${s},stack_trace.ilike.${s}`)
  }

  const { data, error } = await query
  if (error) {
    console.error('Database error in getBugs:', error.message)
    throw new Error('Failed to fetch bugs.')
  }
  return data as BugItem[]
}

export async function createBug(formData: {
  title: string
  project_id?: number | null
  description?: string
  environment?: string
  severity: BugSeverity
  status: BugStatus
  steps_to_reproduce?: string
  stack_trace?: string
  expected_result?: string
  actual_result?: string
  attachments?: { file_path: string; file_name: string; file_type: string; file_size: number }[]
}) {
  const { supabase } = await requireAuth()

  if (!formData.title || !formData.title.trim()) {
    throw new Error('Title is required.')
  }
  
  const insertPayload = {
    title: formData.title.trim(),
    project_id: formData.project_id || null,
    description: formData.description?.trim() || null,
    environment: formData.environment?.trim() || null,
    severity: formData.severity,
    status: formData.status,
    steps_to_reproduce: formData.steps_to_reproduce?.trim() || null,
    stack_trace: formData.stack_trace?.trim() || null,
    expected_result: formData.expected_result?.trim() || null,
    actual_result: formData.actual_result?.trim() || null,
    resolved_at: formData.status === 'resolved' ? new Date().toISOString() : null,
  }

  const { data: bug, error } = await supabase
    .from('bug_items')
    .insert(insertPayload)
    .select()
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
  id: number,
  formData: {
    title: string
    project_id?: number | null
    description?: string
    environment?: string
    severity: BugSeverity
    status: BugStatus
    steps_to_reproduce?: string
    stack_trace?: string
    expected_result?: string
    actual_result?: string
    newAttachments?: { file_path: string; file_name: string; file_type: string; file_size: number }[]
  }
) {
  const { supabase } = await requireAuth()

  if (!formData.title || !formData.title.trim()) {
    throw new Error('Title is required.')
  }

  const updatePayload: Record<string, any> = {
    title: formData.title.trim(),
    project_id: formData.project_id || null,
    description: formData.description?.trim() || null,
    environment: formData.environment?.trim() || null,
    severity: formData.severity,
    status: formData.status,
    steps_to_reproduce: formData.steps_to_reproduce?.trim() || null,
    stack_trace: formData.stack_trace?.trim() || null,
    expected_result: formData.expected_result?.trim() || null,
    actual_result: formData.actual_result?.trim() || null,
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
    .select()
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

export async function updateBugStatus(id: number, status: BugStatus) {
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

export async function deleteBug(id: number) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('bug_items').delete().eq('id', id)
  if (error) {
    console.error('Database error in deleteBug:', error.message)
    throw new Error('Failed to delete bug.')
  }
  revalidatePath('/')
}

export async function deleteAttachment(attachmentId: number, filePath?: string) {
  const { supabase } = await requireAuth()
  if (filePath) {
    try {
      const fileName = filePath.split('/').pop()
      if (fileName) {
        await supabase.storage.from('bug-attachments').remove([fileName])
      }
    } catch (e) {
      console.error('Failed to remove from storage:', e)
    }
  }
  const { error } = await supabase.from('attachments').delete().eq('id', attachmentId)
  if (error) {
    console.error('Database error in deleteAttachment:', error.message)
    throw new Error('Failed to delete attachment.')
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

export async function createProject(formData: {
  name: string
  color?: string
  description?: string
  repository_url?: string
}) {
  const { supabase } = await requireAuth()
  if (!formData.name || !formData.name.trim()) {
    throw new Error('Project name is required.')
  }

  let baseSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!baseSlug) {
    baseSlug = 'project'
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: formData.name.trim(),
      slug: `${baseSlug}-${Date.now().toString().slice(-4)}`,
      color: formData.color || '#6366f1',
      description: formData.description?.trim() || null,
      repository_url: formData.repository_url?.trim() || null,
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

export async function updateProject(
  id: number,
  formData: {
    name: string
    color?: string
    description?: string
    repository_url?: string
  }
) {
  const { supabase } = await requireAuth()
  if (!formData.name || !formData.name.trim()) {
    throw new Error('Project name is required.')
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      name: formData.name.trim(),
      color: formData.color,
      description: formData.description?.trim() || null,
      repository_url: formData.repository_url?.trim() || null,
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

export async function deleteProject(id: number) {
  const { supabase } = await requireAuth()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) {
    console.error('Database error in deleteProject:', error.message)
    throw new Error('Failed to delete project.')
  }
  revalidatePath('/')
}
