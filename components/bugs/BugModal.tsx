'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bug, Sparkles, FileCode, UploadCloud, Trash2 } from 'lucide-react'
import { BugItem, BugSeverity, BugStatus, Project } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { extractSuspectedFiles } from '@/lib/parser'
import { createBug, updateBug } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'

interface BugModalProps {
  show: boolean
  bug: BugItem | null
  projects: Project[]
  selectedProjectId?: string | null
  isGuest?: boolean
  onClose: () => void
  onSuccess: (bug: BugItem) => void
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function BugModal({
  show,
  bug,
  projects,
  selectedProjectId,
  isGuest = false,
  onClose,
  onSuccess,
  notify,
}: BugModalProps) {
  const [title, setTitle] = useState(bug?.title || '')
  const [projectId, setProjectId] = useState<string | null>(
    bug?.project_id || selectedProjectId || null
  )
  const [location, setLocation] = useState(bug?.environment || '')
  const [errorDescription, setErrorDescription] = useState(bug?.description || '')
  const [expectedBehavior, setExpectedBehavior] = useState(bug?.expected_result || '')
  const [severity, setSeverity] = useState<BugSeverity>(bug?.severity || 'medium')
  const [status, setStatus] = useState<BugStatus>(bug?.status || 'open')
  const [detectedFiles, setDetectedFiles] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (show) {
      if (bug) {
        setTitle(bug.title || '')
        setProjectId(bug.project_id || null)
        setLocation(bug.environment || '')
        setErrorDescription(bug.description || '')
        setExpectedBehavior(bug.expected_result || '')
        setSeverity(bug.severity || 'medium')
        setStatus(bug.status || 'open')
        setDetectedFiles(bug.suspected_files || [])
      } else {
        setTitle('')
        setProjectId(selectedProjectId || null)
        setLocation('')
        setErrorDescription('')
        setExpectedBehavior('')
        setSeverity('medium')
        setStatus('open')
        setDetectedFiles([])
      }
      setPendingFiles([])
    }
  }, [show, bug, selectedProjectId, projects])

  useEffect(() => {
    return () => {
      pendingFiles.forEach((p) => {
        if (p.preview.startsWith('blob:')) {
          URL.revokeObjectURL(p.preview)
        }
      })
    }
  }, [pendingFiles])

  useEffect(() => {
    const textToScan = `${location} ${errorDescription}`
    if (!textToScan.trim()) {
      if (!bug) setDetectedFiles([])
      return
    }
    const extracted = extractSuspectedFiles(textToScan)
    if (extracted.length > 0) {
      setDetectedFiles(extracted)
    }
  }, [location, errorDescription, bug])

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.includes('image')) {
        const file = items[i].getAsFile()
        if (file) {
          const preview = URL.createObjectURL(file)
          setPendingFiles((prev) => [...prev, { file, preview }])
          notify('Screenshot pasted and attached!', 'info')
        }
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      notify('Please enter a bug title.', 'error')
      return
    }
    if (!projectId) {
      notify('Please select a project.', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      if (isGuest) {
        // Local guest storage
        if (bug) {
          const updated: BugItem = {
            ...bug,
            title: title.trim(),
            description: errorDescription.trim() || null,
            environment: location.trim() || null,
            severity,
            status,
            expected_result: expectedBehavior.trim() || null,
            suspected_files: detectedFiles,
            updated_at: new Date().toISOString(),
          }
          onSuccess(updated)
        } else {
          const created: BugItem = {
            id: String(Date.now()),
            project_id: projectId,
            title: title.trim(),
            description: errorDescription.trim() || null,
            environment: location.trim() || null,
            severity,
            status,
            expected_result: expectedBehavior.trim() || null,
            suspected_files: detectedFiles,
            order: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          onSuccess(created)
        }
        return
      }

      const supabase = createClient()
      const uploadedAttachments: {
        file_path: string
        file_name: string
        file_type: string
        file_size: number
      }[] = []

      for (const item of pendingFiles) {
        const fileExt = item.file.name.split('.').pop() || 'png'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const { data, error } = await supabase.storage.from('bug-attachments').upload(fileName, item.file)
        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from('bug-attachments').getPublicUrl(data.path)
          uploadedAttachments.push({
            file_path: publicUrlData.publicUrl,
            file_name: item.file.name,
            file_type: item.file.type,
            file_size: item.file.size,
          })
        }
      }

      if (bug) {
        const updated = await updateBug(bug.id, {
          title: title.trim(),
          project_id: projectId,
          description: errorDescription.trim() || null,
          environment: location.trim() || null,
          severity,
          status,
          expected_result: expectedBehavior.trim() || null,
          suspected_files: detectedFiles,
          newAttachments: uploadedAttachments,
        })
        onSuccess(updated)
      } else {
        const created = await createBug({
          title: title.trim(),
          project_id: projectId,
          description: errorDescription.trim() || null,
          environment: location.trim() || null,
          severity,
          status,
          expected_result: expectedBehavior.trim() || null,
          suspected_files: detectedFiles,
          attachments: uploadedAttachments,
        })
        onSuccess(created)
      }
    } catch (err: any) {
      notify(err.message || 'Failed to save bug', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      show={show}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      icon={<Bug className="w-4 h-4" />}
      title={bug ? `Edit Bug #${bug.id}` : 'Report Bug'}
      description="Type what broke, paste screenshot anywhere (Ctrl+V)"
    >
      <div onPaste={handlePaste}>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar max-h-[calc(90vh-140px)]">
          {/* 1. Title */}
          <Input
            label="Title / Problem Summary"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Stripe checkout fails with undefined customer_id"
          />

          {/* Project & Severity / Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Project <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="" disabled>
                  Select project...
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                className="w-full px-3 py-2 text-xs font-bold uppercase bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BugStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* 2. Location (URL or File Path) */}
          <Input
            label="Location (File Path, Component, or URL)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. app/api/checkout/route.ts:42 or https://app.example.com/checkout"
            className="font-mono text-xs"
          />

          {/* 3. Error Explanation / What Happened */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                What Happened / Error Explanation
              </label>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">Paste logs / stack trace freely</span>
            </div>
            <textarea
              rows={4}
              value={errorDescription}
              onChange={(e) => setErrorDescription(e.target.value)}
              placeholder="Explain what broke, error log, or stack trace..."
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Detected Code Anchors */}
          {detectedFiles.length > 0 && (
            <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Auto-detected Code Anchors ({detectedFiles.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {detectedFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-zinc-700"
                  >
                    <FileCode className="w-3 h-3 text-indigo-400" />
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4. Expected Behavior */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Expected Behavior (Optional)
            </label>
            <textarea
              rows={2}
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              placeholder="What should happen instead? e.g. Should redirect to success page and create order record."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Screenshots ({pendingFiles.length + (bug?.attachments?.length || 0)})
              </label>
              <label className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 font-medium">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files
                    if (files) {
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i]
                        const preview = URL.createObjectURL(file)
                        setPendingFiles((prev) => [...prev, { file, preview }])
                      }
                    }
                  }}
                />
              </label>
            </div>

            {pendingFiles.length > 0 || (bug?.attachments && bug.attachments.length > 0) ? (
              <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl">
                {pendingFiles.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800"
                  >
                    <img src={p.preview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(p.preview)
                        setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {bug?.attachments?.map((att) => (
                  <div
                    key={att.id}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800"
                  >
                    <img src={att.file_path} alt={att.file_name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-center text-xs text-slate-400 dark:text-zinc-500">
                Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded text-[10px] font-mono">Ctrl+V</kbd> anywhere to attach screenshot
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {bug ? 'Save Changes' : 'Create Bug'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
