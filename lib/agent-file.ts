import { BugItem, Project } from '@/types'

/**
 * Generates an agent-readable context JSON file that AI agents (Cursor, Claude Code, Windsurf, Aider)
 * can natively read directly from the project repository (`devbug-tracker.json`).
 */
export function generateAgentContextJson(project: Project | null, bugs: BugItem[]): string {
  const openBugs = bugs.filter(b => b.status === 'open' || b.status === 'in_progress')
  const resolvedBugs = bugs.filter(b => b.status === 'resolved' || b.status === 'closed')

  const contextData = {
    $schema: 'https://raw.githubusercontent.com/F41541/devbug-tracker/main/public/schema/agent-context-v1.json',
    app: 'DevBug Tracker',
    generated_at: new Date().toISOString(),
    project: {
      id: project?.id || null,
      name: project?.name || 'Project Workspace',
      slug: project?.slug || 'project',
      repository_url: project?.repository_url || null,
      tech_stack: project?.tech_stack || [],
      test_command: project?.test_command || null,
    },
    metrics: {
      total_active_issues: openBugs.length,
      critical_count: openBugs.filter(b => b.severity === 'critical').length,
      resolved_count: resolvedBugs.length,
    },
    active_issues: openBugs.map(b => ({
      id: b.id,
      title: b.title,
      severity: b.severity,
      status: b.status,
      fix_hint: b.fix_hint || null,
      suspected_files: b.suspected_files || [],
      description: b.description || null,
      steps_to_reproduce: b.steps_to_reproduce || null,
      expected_result: b.expected_result || null,
      actual_result: b.actual_result || null,
      stack_trace: b.stack_trace || null,
      environment: b.environment || null,
      created_at: b.created_at,
    })),
    resolved_history: resolvedBugs.slice(0, 10).map(b => ({
      id: b.id,
      title: b.title,
      severity: b.severity,
      resolved_at: b.resolved_at,
      resolved_commit: b.resolved_commit || null,
    })),
    agent_instructions: [
      '1. Review active_issues sorted by severity (critical first).',
      '2. Inspect suspected_files and fix_hint before scanning the entire codebase.',
      ...(project?.test_command
        ? ['3. Run test_command to verify fixes before committing.']
        : []),
      '4. Keep code changes minimal and surgical.',
    ],
  }

  return JSON.stringify(contextData, null, 2)
}

/**
 * Generates an agent-friendly markdown file (DEVBUG-TRACKER.md)
 */
export function generateAgentContextMarkdown(project: Project | null, bugs: BugItem[]): string {
  const openBugs = bugs.filter(b => b.status === 'open' || b.status === 'in_progress')
  
  let md = `# DevBug Tracker Context: ${project?.name || 'Project Workspace'}\n\n`
  md += `> Generated on ${new Date().toLocaleString()} for AI Agent & Local Developer use.\n\n`

  if (project) {
    md += `## Project Metadata\n`
    if (project.repository_url) md += `- **Repository:** ${project.repository_url}\n`
    if (project.tech_stack && project.tech_stack.length > 0) md += `- **Tech Stack:** ${project.tech_stack.join(', ')}\n`
    if (project.test_command) md += `- **Test Command:** \`${project.test_command}\`\n`
    md += `\n`
  }

  md += `## Active Issues (${openBugs.length})\n\n`

  if (openBugs.length === 0) {
    md += `*No open bugs or active issues at the moment.*\n\n`
  } else {
    openBugs.forEach((bug, index) => {
      md += `### ${index + 1}. [${bug.severity.toUpperCase()}] #${bug.id} ${bug.title}\n`
      md += `- **Status:** ${bug.status}\n`
      if (bug.fix_hint) md += `- **💡 Fix Hint:** ${bug.fix_hint}\n`
      if (bug.suspected_files && bug.suspected_files.length > 0) {
        md += `- **🎯 Suspected Files:** \`${bug.suspected_files.join('`, `')}\`\n`
      }
      if (bug.description) md += `\n**Description:**\n${bug.description}\n`
      if (bug.stack_trace) md += `\n**Stack Trace:**\n\`\`\`\n${bug.stack_trace}\n\`\`\`\n`
      md += `\n---\n\n`
    })
  }

  return md
}
