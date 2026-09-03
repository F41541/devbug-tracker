import { BugItem, Project } from '@/types'

export interface AIPromptOptions {
  baseUrl?: string
  apiKey?: string
}

/**
 * Generate a high-density XML investigation dossier tailored for AI Coding Agents.
 */
export function generateAIPromptForBug(
  bug: BugItem,
  project?: Project | null,
  options?: AIPromptOptions
): string {
  const proj = project || bug.project
  const suspected = (bug.suspected_files && bug.suspected_files.length > 0)
    ? bug.suspected_files
    : []

  const suspectedXml = suspected.length > 0
    ? suspected.map(f => `      <file>${escapeXml(f)}</file>`).join('\n')
    : '      <file>None explicitly identified</file>'

  const hostUrl = (options?.baseUrl || 'http://localhost:3000').replace(/\/$/, '')
  const authHeader = options?.apiKey ? ` -H "x-api-key: ${options.apiKey}"` : ''

  let dossier = `<bug_investigation_dossier id="${bug.id}">\n`

  // 1. Project Metadata
  dossier += `  <project_metadata>\n`
  dossier += `    <name>${escapeXml(proj?.name || 'Project')}</name>\n`
  if (proj?.repository_url) dossier += `    <repo_url>${escapeXml(proj.repository_url)}</repo_url>\n`
  if (proj?.tech_stack && proj.tech_stack.length > 0) {
    dossier += `    <tech_stack>${escapeXml(proj.tech_stack.join(', '))}</tech_stack>\n`
  }
  if (proj?.test_command) dossier += `    <test_command>${escapeXml(proj.test_command)}</test_command>\n`
  dossier += `  </project_metadata>\n\n`

  // 2. Problem Statement
  dossier += `  <problem_statement severity="${bug.severity}" status="${bug.status}" investigation_state="${bug.investigation_state || 'unconfirmed'}">\n`
  dossier += `    <title>${escapeXml(bug.title)}</title>\n`
  if (bug.environment) dossier += `    <location_or_url>${escapeXml(bug.environment)}</location_or_url>\n`
  if (bug.description) dossier += `    <error_explanation>${escapeXml(bug.description)}</error_explanation>\n`
  if (bug.expected_result) dossier += `    <expected_behavior>${escapeXml(bug.expected_result)}</expected_behavior>\n`
  if (bug.steps_to_reproduce) dossier += `    <steps_to_reproduce>\n${escapeXml(bug.steps_to_reproduce)}\n    </steps_to_reproduce>\n`
  if (bug.actual_result) dossier += `    <actual_behavior>${escapeXml(bug.actual_result)}</actual_behavior>\n`
  dossier += `  </problem_statement>\n\n`

  // 3. Code Anchors & Human Fix Hint
  dossier += `  <code_anchors>\n`
  dossier += `    <suspected_files>\n${suspectedXml}\n    </suspected_files>\n`
  if (bug.confirmed_files && bug.confirmed_files.length > 0) {
    dossier += `    <confirmed_files>\n${bug.confirmed_files.map(f => `      <file>${escapeXml(f)}</file>`).join('\n')}\n    </confirmed_files>\n`
  }
  if (bug.fix_hint) {
    dossier += `    <human_fix_hint>${escapeXml(bug.fix_hint)}</human_fix_hint>\n`
  }
  dossier += `  </code_anchors>\n\n`

  // 4. Failed Attempts (Negative Knowledge)
  if (bug.failed_attempts && bug.failed_attempts.length > 0) {
    dossier += `  <do_not_attempt_prior_failures count="${bug.failed_attempts.length}">\n`
    bug.failed_attempts.forEach((attempt, i) => {
      dossier += `    <failed_attempt index="${i + 1}" at="${escapeXml(attempt.timestamp)}">\n`
      dossier += `      <hypothesis>${escapeXml(attempt.hypothesis)}</hypothesis>\n`
      if (attempt.files_modified && attempt.files_modified.length > 0) {
        dossier += `      <modified>${escapeXml(attempt.files_modified.join(', '))}</modified>\n`
      }
      dossier += `      <reason_failed>${escapeXml(attempt.failure_reason)}</reason_failed>\n`
      dossier += `    </failed_attempt>\n`
    })
    dossier += `  </do_not_attempt_prior_failures>\n\n`
  }

  // 5. Stack Trace
  if (bug.stack_trace) {
    dossier += `  <stack_trace>\n${escapeXml(bug.stack_trace)}\n  </stack_trace>\n\n`
  }

  // 6. Realtime Lifecycle Synchronization Protocol (CLI Trigger)
  dossier += `  <agent_lifecycle_sync_protocol>\n`
  dossier += `    CRITICAL: You MUST execute the following shell commands in background terminal to sync live progress with the DevBug Tracker dashboard:\n\n`
  dossier += `    STEP 1 (ON START - before touching code):\n`
  dossier += `    curl -s -X PATCH "${hostUrl}/api/v1/bugs" -H "Content-Type: application/json"${authHeader} -d '{"id": ${bug.id}, "status": "in_progress", "investigation_state": "fix_in_progress"}'\n\n`
  dossier += `    STEP 2 (ON SUCCESS - after fixing and verification passes):\n`
  dossier += `    curl -s -X PATCH "${hostUrl}/api/v1/bugs" -H "Content-Type: application/json"${authHeader} -d '{"id": ${bug.id}, "status": "resolved", "investigation_state": "verified", "root_cause": "FIXED: [brief description of root cause and what you changed]"}'\n`
  dossier += `  </agent_lifecycle_sync_protocol>\n\n`

  // 7. Agent Instructions
  dossier += `  <agent_instructions>\n`
  dossier += `    1. Run STEP 1 curl command above to announce work in progress.\n`
  dossier += `    2. Start investigation strictly within <code_anchors> and <location_or_url>.\n`
  if (bug.failed_attempts && bug.failed_attempts.length > 0) {
    dossier += `    3. CRITICAL: Do NOT repeat approaches listed in <do_not_attempt_prior_failures>.\n`
    dossier += `    4. Isolate root cause before modifying code.\n`
  } else {
    dossier += `    3. Isolate root cause before modifying code.\n`
  }
  if (proj?.test_command) {
    dossier += `    ${bug.failed_attempts && bug.failed_attempts.length > 0 ? '5' : '4'}. Run verification command (${escapeXml(proj.test_command)}) to validate fix.\n`
  } else {
    dossier += `    ${bug.failed_attempts && bug.failed_attempts.length > 0 ? '5' : '4'}. Apply minimal surgical fix and verify there are no side effects.\n`
  }
  dossier += `    ${bug.failed_attempts && bug.failed_attempts.length > 0 ? '6' : '5'}. Run STEP 2 curl command above to mark the issue resolved in the dashboard.\n`
  dossier += `  </agent_instructions>\n`
  dossier += `</bug_investigation_dossier>`

  return dossier
}

/**
 * Generate a concise batch task list for AI agents
 */
export function generateBulkAIPrompt(
  bugs: BugItem[],
  project?: Project | null,
  options?: AIPromptOptions
): string {
  const hostUrl = (options?.baseUrl || 'http://localhost:3000').replace(/\/$/, '')
  const authHeader = options?.apiKey ? ` -H "x-api-key: ${options.apiKey}"` : ''

  let prompt = `<batch_bug_investigation count="${bugs.length}">\n`
  bugs.forEach((bug, index) => {
    prompt += `  <bug index="${index + 1}" id="${bug.id}" severity="${bug.severity}" status="${bug.status}">\n`
    prompt += `    <project>${escapeXml(bug.project?.name || project?.name || 'Project')}</project>\n`
    prompt += `    <title>${escapeXml(bug.title)}</title>\n`
    if (bug.fix_hint) prompt += `    <hint>${escapeXml(bug.fix_hint)}</hint>\n`
    if (bug.suspected_files && bug.suspected_files.length > 0) {
      prompt += `    <anchors>${escapeXml(bug.suspected_files.join(', '))}</anchors>\n`
    }
    prompt += `    <sync_start>curl -s -X PATCH "${hostUrl}/api/v1/bugs" -H "Content-Type: application/json"${authHeader} -d '{"id": ${bug.id}, "status": "in_progress", "investigation_state": "fix_in_progress"}'</sync_start>\n`
    prompt += `    <sync_done>curl -s -X PATCH "${hostUrl}/api/v1/bugs" -H "Content-Type: application/json"${authHeader} -d '{"id": ${bug.id}, "status": "resolved", "investigation_state": "verified", "root_cause": "FIXED: [summary]"}'</sync_done>\n`
    prompt += `  </bug>\n`
  })
  prompt += `  <agent_execution_protocol>\n`
  prompt += `    1. Triage and resolve bugs above in order of priority (critical -> high -> medium -> low).\n`
  prompt += `    2. Before starting a bug, execute its <sync_start> curl command in the background.\n`
  prompt += `    3. Inspect files, isolate root cause, and apply surgical fix.\n`
  if (project?.test_command) {
    prompt += `    4. Run '${escapeXml(project.test_command)}' to verify.\n`
  }
  prompt += `    5. Immediately upon verified fix, execute its <sync_done> curl command to notify the dashboard.\n`
  prompt += `  </agent_execution_protocol>\n`
  prompt += `</batch_bug_investigation>`
  return prompt
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
