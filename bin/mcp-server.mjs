#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const baseUrl = (process.env.DEVBUG_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const apiKey = process.env.DEVBUG_API_KEY
const defaultWorkspaceId = process.env.DEVBUG_WORKSPACE_ID

if (!apiKey) {
  console.error('DEVBUG_API_KEY environment variable is required to run devbug-mcp-server.')
  process.exit(1)
}

const server = new Server(
  {
    name: 'devbug-tracker',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

function getHeaders() {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_open_bugs',
        description: 'Fetch open and active bugs from DevBug Tracker.',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: "Status filter: 'open', 'in_progress', 'resolved', or 'all'. Defaults to 'open'.",
              enum: ['open', 'in_progress', 'resolved', 'closed', 'all'],
            },
            project_id: {
              type: 'number',
              description: 'Optional numeric project ID filter.',
            },
            workspace_id: {
              type: 'string',
              description: 'Optional workspace UUID filter (defaults to DEVBUG_WORKSPACE_ID env var if set).',
            },
          },
        },
      },
      {
        name: 'get_bug_detail',
        description: 'Retrieve full details of a specific bug by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            bug_id: {
              type: 'number',
              description: 'ID of the bug item.',
            },
          },
          required: ['bug_id'],
        },
      },
      {
        name: 'update_bug_investigation',
        description: 'Update the technical investigation state, failed hypotheses, or status of a bug.',
        inputSchema: {
          type: 'object',
          properties: {
            bug_id: {
              type: 'number',
              description: 'ID of the bug to update.',
            },
            status: {
              type: 'string',
              enum: ['open', 'in_progress', 'resolved', 'closed'],
              description: 'Managerial status of the bug.',
            },
            investigation_state: {
              type: 'string',
              enum: [
                'unconfirmed',
                'reproduced',
                'root_cause_isolated',
                'fix_in_progress',
                'fix_blocked',
                'verified',
              ],
              description: 'Technical debugging stage.',
            },
            root_cause: {
              type: 'string',
              description: 'Discovered root cause explanation.',
            },
            failed_attempt: {
              type: 'object',
              description: 'Record a failed hypothesis to prevent repeating invalid fixes.',
              properties: {
                hypothesis: { type: 'string' },
                failure_reason: { type: 'string' },
                files_modified: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['hypothesis', 'failure_reason'],
            },
            resolved_commit: {
              type: 'string',
              description: 'Git commit SHA that resolves this bug.',
            },
          },
          required: ['bug_id'],
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    if (name === 'get_open_bugs') {
      const status = args?.status || 'open'
      const projectId = args?.project_id
      const workspaceId = args?.workspace_id || defaultWorkspaceId

      let url = `${baseUrl}/api/v1/bugs?status=${encodeURIComponent(status)}`
      if (projectId) url += `&project_id=${projectId}`
      if (workspaceId) url += `&workspace_id=${encodeURIComponent(workspaceId)}`

      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) {
        const errText = await res.text()
        return {
          content: [{ type: 'text', text: `API Error ${res.status}: ${errText}` }],
          isError: true,
        }
      }

      const data = await res.json()
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      }
    }

    if (name === 'get_bug_detail') {
      const bugId = args?.bug_id
      const url = `${baseUrl}/api/v1/bugs?status=all`
      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) {
        const errText = await res.text()
        return {
          content: [{ type: 'text', text: `API Error ${res.status}: ${errText}` }],
          isError: true,
        }
      }

      const data = await res.json()
      const bug = (data.bugs || []).find((b) => b.id === bugId)

      if (!bug) {
        return {
          content: [{ type: 'text', text: `Bug with ID #${bugId} not found.` }],
          isError: true,
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(bug, null, 2) }],
      }
    }

    if (name === 'update_bug_investigation') {
      const bugId = args?.bug_id
      const payload = { id: bugId }

      if (args?.status) payload.status = args.status
      if (args?.investigation_state) payload.investigation_state = args.investigation_state
      if (args?.root_cause) payload.root_cause = args.root_cause
      if (args?.resolved_commit) payload.resolved_commit = args.resolved_commit

      if (args?.failed_attempt) {
        // Fetch current bug to append failed attempt
        const getUrl = `${baseUrl}/api/v1/bugs?status=all`
        const getRes = await fetch(getUrl, { headers: getHeaders() })
        if (getRes.ok) {
          const allData = await getRes.json()
          const currentBug = (allData.bugs || []).find((b) => b.id === bugId)
          const priorAttempts = Array.isArray(currentBug?.failed_attempts)
            ? currentBug.failed_attempts
            : []
          const attempt = args.failed_attempt
          payload.failed_attempts = [
            ...priorAttempts,
            {
              timestamp: new Date().toISOString(),
              agent: 'MCP AI Agent',
              hypothesis: attempt.hypothesis,
              files_modified: attempt.files_modified || [],
              failure_reason: attempt.failure_reason,
            },
          ]
        }
      }

      const res = await fetch(`${baseUrl}/api/v1/bugs`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errText = await res.text()
        return {
          content: [{ type: 'text', text: `API Error ${res.status}: ${errText}` }],
          isError: true,
        }
      }

      const result = await res.json()
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    }

    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Execution error: ${err.message}` }],
      isError: true,
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('DevBug MCP Server running on stdio transport.')
}

main().catch((err) => {
  console.error('Fatal MCP server error:', err)
  process.exit(1)
})
