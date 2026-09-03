/**
 * Extract suspected file paths and code anchors from raw error logs,
 * stack traces, or freeform text using regex heuristics.
 */
export function extractSuspectedFiles(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return []

  const detected = new Set<string>()

  // 1. JavaScript / TypeScript / Node / Webpack / Next.js stack traces
  // Examples: "at App (src/components/Modal.tsx:45:10)", "at /app/api/webhooks/route.ts:19:5"
  const jsStackRegex = /(?:at\s+(?:[a-zA-Z0-9_$<>.]+\s+)?\(?|\bfrom\s+)(['"]?)([a-zA-Z0-9_@/.-]+\.(?:tsx?|jsx?|vue|svelte|mjs|cjs|json|css|scss))(?::\d+)?(?::\d+)?\1\)?/gi
  let match: RegExpExecArray | null
  while ((match = jsStackRegex.exec(rawText)) !== null) {
    const file = match[2]
    if (isValidFilePath(file)) {
      detected.add(cleanFilePath(file))
    }
  }

  // 2. Python / PHP / Ruby / Go / Rust / Java trace patterns
  // Examples: "File "app/services/auth.py", line 45", "at App\Http\Controllers\StripeController->handle(StripeController.php:19)"
  const genericStackRegex = /(?:File\s+["']|\((?:[a-zA-Z0-9_]+\.(?:php|py|rb|go|rs|java|kt|dart)):\d+\)|->[a-zA-Z0-9_]+\(([a-zA-Z0-9_.-]+\.(?:php|py|rb|go|rs|java|kt|dart)):\d+\))([a-zA-Z0-9_@/.-]+\.(?:php|py|rb|go|rs|java|kt|dart))/gi
  while ((match = genericStackRegex.exec(rawText)) !== null) {
    const file = match[1] || match[2]
    if (file && isValidFilePath(file)) {
      detected.add(cleanFilePath(file))
    }
  }

  // 3. Direct relative or repository file paths in backticks or whitespace
  // Examples: `src/components/BugModal.tsx`, `components/auth/Login.vue`
  const directPathRegex = /(?:[`"']|^|\s)([a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+\.(?:tsx?|jsx?|vue|svelte|php|py|rb|go|rs|java|kt|dart|sql|json|yml|yaml|env|toml))(?=[`"']|$|\s|:|,|\))/gi
  while ((match = directPathRegex.exec(rawText)) !== null) {
    const file = match[1]
    if (isValidFilePath(file)) {
      detected.add(cleanFilePath(file))
    }
  }

  return Array.from(detected).slice(0, 10) // Limit to top 10 anchors
}

function cleanFilePath(filePath: string): string {
  let cleaned = filePath.trim().replace(/^webpack-internal:\/\/\//, '').replace(/^file:\/\//, '')
  // Strip node_modules prefix if it refers to internal package source
  if (cleaned.startsWith('./')) {
    cleaned = cleaned.slice(2)
  }
  return cleaned
}

function isValidFilePath(filePath: string): boolean {
  if (!filePath || filePath.length < 3) return false
  // Ignore node_modules internals or system libraries unless specified
  if (filePath.includes('node_modules/') || filePath.startsWith('internal/')) return false
  return true
}
