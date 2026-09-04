import { z } from 'zod'

export const bugStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed'])
export const bugSeveritySchema = z.enum(['critical', 'high', 'medium', 'low'])
export const investigationStateSchema = z.enum([
  'unconfirmed',
  'reproduced',
  'root_cause_isolated',
  'fix_in_progress',
  'fix_blocked',
  'verified',
])
export const reproductionReliabilitySchema = z.enum([
  'untested',
  'deterministic',
  'intermittent',
  'cannot_reproduce',
])

export const failedAttemptSchema = z.object({
  timestamp: z.string(),
  agent: z.string().optional(),
  hypothesis: z.string(),
  files_modified: z.array(z.string()).optional(),
  failure_reason: z.string(),
})

export const attachmentInputSchema = z.object({
  file_path: z.string().min(1),
  file_name: z.string().min(1),
  file_type: z.string(),
  file_size: z.number().nonnegative(),
})

export const bugInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  project_id: z.string().min(1, 'Project is required.'),
  description: z.string().trim().nullable().optional(),
  environment: z.string().trim().nullable().optional(),
  status: bugStatusSchema.default('open'),
  severity: bugSeveritySchema.default('medium'),
  investigation_state: investigationStateSchema.default('unconfirmed').optional(),
  reproduction_reliability: reproductionReliabilitySchema.default('untested').optional(),
  fix_hint: z.string().trim().nullable().optional(),
  suspected_files: z.array(z.string()).nullable().optional(),
  confirmed_files: z.array(z.string()).nullable().optional(),
  root_cause: z.string().trim().nullable().optional(),
  failed_attempts: z.array(failedAttemptSchema).optional(),
  branch_name: z.string().trim().nullable().optional(),
  base_commit_sha: z.string().trim().nullable().optional(),
  resolved_commit: z.string().trim().nullable().optional(),
  steps_to_reproduce: z.string().trim().nullable().optional(),
  stack_trace: z.string().trim().nullable().optional(),
  expected_result: z.string().trim().nullable().optional(),
  actual_result: z.string().trim().nullable().optional(),
  attachments: z.array(attachmentInputSchema).optional(),
  newAttachments: z.array(attachmentInputSchema).optional(),
})

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.'),
  color: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  repository_url: z.string().trim().nullable().optional(),
  tech_stack: z.array(z.string()).nullable().optional(),
  package_manager: z.string().trim().nullable().optional(),
  test_command: z.string().trim().nullable().optional(),
})
