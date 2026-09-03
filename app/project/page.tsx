import { createClient } from '@/lib/supabase/server'
import { getProjects, getBugs } from '@/app/actions'
import { getApiKeys } from '@/app/integrations/actions'
import { ProjectsPageClient } from '@/components/projects/ProjectsPageClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let projects: any[] = []
  let bugs: any[] = []
  let apiKeys: any[] = []

  try {
    const [p, b, keys] = await Promise.all([getProjects(), getBugs(), getApiKeys()])
    projects = p
    bugs = b
    apiKeys = keys
  } catch (err) {
    console.error('Failed to load projects page data:', err)
  }

  return (
    <ProjectsPageClient
      initialProjects={projects}
      initialBugs={bugs}
      userEmail={user.email}
      hasApiKeys={apiKeys.length > 0}
    />
  )
}
