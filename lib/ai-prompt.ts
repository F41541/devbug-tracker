import { BugItem, Project } from '@/types'

export interface AIPromptOptions {
  baseUrl?: string
  apiKey?: string
  projectNumberMap?: Map<string, number>
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
  const endpointUrl = `${hostUrl}/api/v1/bugs`
  const apiKeyStr = options?.apiKey || ''
  const authHeader = apiKeyStr ? ` -H "Authorization: Bearer ${apiKeyStr}"` : ''

  let dossier = `<bug_investigation_dossier id="${bug.id}">\n`

  // 1. Agent Environment & Authentication
  dossier += `  <agent_environment>\n`
  dossier += `    <server_url>${escapeXml(hostUrl)}</server_url>\n`
  dossier += `    <project_id>${proj?.id || bug.project_id || ''}</project_id>\n`
  dossier += `    <api_key>${escapeXml(apiKeyStr)}</api_key>\n`
  dossier += `    <health_check_url>${escapeXml(hostUrl)}/api/health</health_check_url>\n`
  dossier += `    <note>Do not execute manual unauthenticated cURL requests against /api/v1/bugs. Use the pre-configured npx devbug CLI commands provided below.</note>\n`
  dossier += `  </agent_environment>\n\n`

  // 2. Project Metadata
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
  dossier += `    CRITICAL: You MUST execute the following CLI commands in background terminal to sync live progress with DevBug Tracker:\n\n`
  dossier += `    STEP 1 (ON START - before touching code):\n`
  dossier += `    npx devbug start ${bug.id}${apiKeyStr ? ` --key=${apiKeyStr}` : ''} --url=${hostUrl}\n\n`
  dossier += `    STEP 2 (ON SUCCESS - after fixing and verification passes):\n`
  dossier += `    npx devbug resolve ${bug.id} "FIXED: [brief description of what you changed]"${apiKeyStr ? ` --key=${apiKeyStr}` : ''} --url=${hostUrl}\n`
  dossier += `  </agent_lifecycle_sync_protocol>\n\n`

  // 7. Agent Instructions
  dossier += `  <agent_instructions>\n`
  dossier += `    1. Run STEP 1 command above (npx devbug start) to announce work in progress.\n`
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
  dossier += `    ${bug.failed_attempts && bug.failed_attempts.length > 0 ? '6' : '5'}. Run STEP 2 command above (npx devbug resolve) to mark the issue resolved in the dashboard.\n`
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
  const endpointUrl = `${hostUrl}/api/v1/bugs`
  const apiKeyStr = options?.apiKey || ''
  const authHeader = apiKeyStr ? ` -H "Authorization: Bearer ${apiKeyStr}"` : ''

  // Filter: only 'open' bugs get actionable tasks with sync curl commands
  const openBugs = bugs.filter((b) => b.status === 'open')
  const inProgressBugs = bugs.filter((b) => b.status === 'in_progress')
  const resolvedBugs = bugs.filter((b) => b.status === 'resolved' || b.status === 'closed')

  const getDisplayId = (b: BugItem) => options?.projectNumberMap?.get(b.id) ?? b.id

  let prompt = `<batch_bug_investigation active_count="${openBugs.length}">\n`

  // 1. Agent Environment & Authentication
  prompt += `  <agent_environment>\n`
  prompt += `    <server_url>${escapeXml(hostUrl)}</server_url>\n`
  prompt += `    <project_id>${project?.id || bugs[0]?.project_id || ''}</project_id>\n`
  prompt += `    <api_key>${escapeXml(apiKeyStr)}</api_key>\n`
  prompt += `    <health_check_url>${escapeXml(hostUrl)}/api/health</health_check_url>\n`
  prompt += `    <note>Do not execute manual unauthenticated cURL requests against /api/v1/bugs. Always use the pre-configured 'npx devbug' CLI commands in &lt;sync_start&gt; and &lt;sync_done&gt;.</note>\n`
  prompt += `  </agent_environment>\n\n`

  // 2. Execution Protocol & Triage Matrix (Directive-First: read before processing bug list)
  prompt += `  <agent_execution_protocol>\n`
  prompt += `    RULE 1 - MANDATORY TRIAGE PLAN (DO THIS FIRST BEFORE TOUCHING CODE):\n`
  prompt += `       - In your very first response, you MUST output a structured cluster plan before editing any file.\n`
  prompt += `       - Group issues by identical location, page, URL, or shared component first (Cluster 1, Cluster 2, etc.).\n`
  prompt += `       - Within each cluster, sort bugs by severity: critical -> high -> medium -> low.\n`
  prompt += `       - Work cluster-by-cluster end-to-end to avoid jumping back and forth across files.\n`
  prompt += `    RULE 2 - STRICT SINGLE-ISSUE LIFECYCLE (NO BATCH CHAINING):\n`
  prompt += `       - Complete each bug sequentially: START -> INVESTIGATE -> SURGICAL FIX -> VERIFY -> RESOLVE.\n`
  prompt += `       - Run <sync_start> CLI command (npx devbug start ...) immediately when you begin working on a specific bug.\n`
  prompt += `       - You MUST NOT combine CLI commands using chaining operators (&&, ;, ||).\n`
  prompt += `       - Only ONE bug may be in "in_progress" status at any given time.\n`
  prompt += `       - You MUST NOT begin or touch files for the next bug until the current bug is fully verified and marked resolved via <sync_done>.\n`
  prompt += `       - Do not make unauthenticated manual cURL requests.\n`
  prompt += `    RULE 3 - SURGICAL INVESTIGATION & FIX:\n`
  prompt += `       - Follow anchors & locations, isolate root cause, make minimal surgical changes.\n`
  if (project?.test_command) {
    prompt += `    RULE 4 - VERIFICATION:\n`
    prompt += `       - Run '${escapeXml(project.test_command)}' to verify.\n`
    prompt += `    RULE 5 - COMPLETION SYNC:\n`
    prompt += `       - Run <sync_done> CLI command (npx devbug resolve ...) immediately upon verified fix with brief root cause explanation.\n`
  } else {
    prompt += `    RULE 4 - COMPLETION SYNC:\n`
    prompt += `       - Run <sync_done> CLI command (npx devbug resolve ...) immediately upon verified fix with brief root cause explanation.\n`
  }
  prompt += `  </agent_execution_protocol>\n\n`

  // Summary section for non-open issues to avoid prompt clutter
  if (inProgressBugs.length > 0 || resolvedBugs.length > 0) {
    prompt += `  <status_overview>\n`
    if (inProgressBugs.length > 0) {
      prompt += `    <in_progress ids="${inProgressBugs.map((b) => `#${getDisplayId(b)}`).join(', ')}">${inProgressBugs.map((b) => `#${getDisplayId(b)} "${escapeXml(b.title)}"`).join('; ')}</in_progress>\n`
    }
    if (resolvedBugs.length > 0) {
      prompt += `    <resolved count="${resolvedBugs.length}" ids="${resolvedBugs.map((b) => `#${getDisplayId(b)}`).join(', ')}" />\n`
    }
    prompt += `  </status_overview>\n\n`
  }

  // Active open bugs list
  openBugs.forEach((bug, index) => {
    const displayId = getDisplayId(bug)
    prompt += `  <bug index="${index + 1}" id="${bug.id}" display_id="#${displayId}" severity="${bug.severity}" status="${bug.status}">\n`
    prompt += `    <project>${escapeXml(bug.project?.name || project?.name || 'Project')}</project>\n`
    prompt += `    <title>${escapeXml(bug.title)}</title>\n`
    if (bug.environment) prompt += `    <location>${escapeXml(bug.environment)}</location>\n`
    if (bug.description) prompt += `    <description>${escapeXml(bug.description)}</description>\n`
    if (bug.expected_result) prompt += `    <expected>${escapeXml(bug.expected_result)}</expected>\n`
    if (bug.fix_hint) prompt += `    <hint>${escapeXml(bug.fix_hint)}</hint>\n`
    if (bug.suspected_files && bug.suspected_files.length > 0) {
      prompt += `    <anchors>${escapeXml(bug.suspected_files.join(', '))}</anchors>\n`
    }
    prompt += `    <sync_start>npx devbug start ${bug.id}${apiKeyStr ? ` --key=${apiKeyStr}` : ''} --url=${hostUrl}</sync_start>\n`
    prompt += `    <sync_done>npx devbug resolve ${bug.id} "FIXED: [summary]"${apiKeyStr ? ` --key=${apiKeyStr}` : ''} --url=${hostUrl}</sync_done>\n`
    prompt += `  </bug>\n`
  })

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
