#!/usr/bin/env node

/**
 * DevBug Tracker CLI
 * Fast, lightweight CLI to sync agent lifecycle events directly from terminal
 * Usage:
 *   npx devbug-tracker start <id> [--key=<key>] [--url=<url>]
 *   npx devbug-tracker resolve <id> [root_cause] [--key=<key>] [--url=<url>]
 *   npx devbug-tracker fail <id> <reason> [--key=<key>] [--url=<url>]
 *   npx devbug-tracker list [--project=<id>] [--key=<key>] [--url=<url>]
 */

const rawArgs = process.argv.slice(2)

if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
  printHelp()
  process.exit(0)
}

function parseFlags(args) {
  let command = null
  const positional = []
  const flags = {
    key: process.env.DEVBUG_API_KEY || process.env.DEVBUG_KEY || '',
    url: process.env.DEVBUG_URL || process.env.DEVBUG_BASE_URL || 'http://localhost:3000',
    project: process.env.DEVBUG_PROJECT_ID || '',
  }

  for (const arg of args) {
    if (arg.startsWith('--key=')) {
      flags.key = arg.slice(6).trim()
    } else if (arg.startsWith('--url=')) {
      flags.url = arg.slice(6).trim().replace(/\/$/, '')
    } else if (arg.startsWith('--project=')) {
      flags.project = arg.slice(10).trim()
    } else if (!command) {
      command = arg.toLowerCase()
    } else {
      positional.push(arg)
    }
  }

  return { command, positional, flags }
}

function printHelp() {
  console.log(`
DevBug Tracker CLI - Autonomous AI Agent Lifecycle Sync

Usage:
  npx devbug-tracker start <bug_id> [--key=<key>] [--url=<url>]
  npx devbug-tracker resolve <bug_id> [root_cause] [--key=<key>] [--url=<url>]
  npx devbug-tracker fail <bug_id> <failure_reason> [--key=<key>] [--url=<url>]
  npx devbug-tracker list [--project=<id>] [--key=<key>] [--url=<url>]

Options:
  --key=<api_key>   DevBug Tracker API Key (or set DEVBUG_API_KEY env)
  --url=<base_url>  Base application URL (default: http://localhost:3000 or DEVBUG_URL)
  --project=<id>    Project ID filter for list command
  -h, --help        Show this help message
`)
}

async function main() {
  const { command, positional, flags } = parseFlags(rawArgs)

  const baseUrl = flags.url.replace(/\/$/, '')
  const headers = {
    'Content-Type': 'application/json',
  }

  if (flags.key) {
    headers['Authorization'] = `Bearer ${flags.key}`
  }

  if (command === 'start') {
    const bugId = positional[0]?.trim()
    if (!bugId) {
      console.error('Error: Bug ID is required. Example: npx devbug-tracker start <bug_uuid>')
      process.exit(1)
    }

    try {
      const res = await fetch(`${baseUrl}/api/v1/bugs`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: bugId,
          status: 'in_progress',
          investigation_state: 'fix_in_progress',
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`[DevBug Tracker] Failed to start bug #${bugId} (HTTP ${res.status}): ${err}`)
        process.exit(1)
      }

      console.log(`[DevBug Tracker] OK: Bug #${bugId} status set to IN PROGRESS`)
    } catch (err) {
      console.error(`[DevBug Tracker] Network error: ${err.message}`)
      process.exit(1)
    }
  } else if (command === 'resolve') {
    const bugId = positional[0]?.trim()
    if (!bugId) {
      console.error('Error: Bug ID is required. Example: npx devbug-tracker resolve <bug_uuid> "Fixed typo in route.ts"')
      process.exit(1)
    }

    const rootCause = positional.slice(1).join(' ') || 'Resolved by AI Agent'

    try {
      const res = await fetch(`${baseUrl}/api/v1/bugs`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: bugId,
          status: 'resolved',
          investigation_state: 'verified',
          root_cause: rootCause,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`[DevBug Tracker] Failed to resolve bug #${bugId} (HTTP ${res.status}): ${err}`)
        process.exit(1)
      }

      console.log(`[DevBug Tracker] OK: Bug #${bugId} status set to RESOLVED ("${rootCause}")`)
    } catch (err) {
      console.error(`[DevBug Tracker] Network error: ${err.message}`)
      process.exit(1)
    }
  } else if (command === 'fail') {
    const bugId = positional[0]?.trim()
    if (!bugId) {
      console.error('Error: Bug ID is required. Example: npx devbug-tracker fail <bug_uuid> "Unit tests failed with exit code 1"')
      process.exit(1)
    }

    const reason = positional.slice(1).join(' ') || 'Hypothesis failed'

    try {
      const res = await fetch(`${baseUrl}/api/v1/bugs`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          id: bugId,
          investigation_state: 'fix_blocked',
          failed_attempt: {
            hypothesis: 'Attempted fix',
            failure_reason: reason,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`[DevBug Tracker] Failed to record attempt on bug #${bugId} (HTTP ${res.status}): ${err}`)
        process.exit(1)
      }

      console.log(`[DevBug Tracker] OK: Recorded failed attempt on bug #${bugId}: "${reason}"`)
    } catch (err) {
      console.error(`[DevBug Tracker] Network error: ${err.message}`)
      process.exit(1)
    }
  } else if (command === 'list') {
    const url = new URL(`${baseUrl}/api/v1/bugs`)
    url.searchParams.set('status', 'open')
    if (flags.project) {
      url.searchParams.set('project_id', flags.project)
    }

    try {
      const res = await fetch(url.toString(), {
        headers,
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`[DevBug Tracker] Failed to list bugs (HTTP ${res.status}): ${err}`)
        process.exit(1)
      }

      const data = await res.json()
      const bugs = data.bugs || []
      console.log(`[DevBug Tracker] Active Open Bugs (${bugs.length}):`)
      bugs.forEach((b) => {
        console.log(`  #${b.id} [${b.severity.toUpperCase()}] ${b.title} (${b.environment || 'No file'})`)
      })
    } catch (err) {
      console.error(`[DevBug Tracker] Network error: ${err.message}`)
      process.exit(1)
    }
  } else {
    console.error(`Unknown command: "${command}". Run "npx devbug-tracker --help" for available commands.`)
    process.exit(1)
  }
}

main()
