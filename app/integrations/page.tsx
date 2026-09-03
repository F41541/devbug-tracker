import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IntegrationsClient from '@/components/IntegrationsClient'
import { getApiKeys } from '@/app/integrations/actions'
import { getProjects, getBugs } from '@/app/actions'
import { Project, BugItem } from '@/types'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let apiKeys: any[] = []
  let projects: Project[] = []
  let bugs: BugItem[] = []

  if (user) {
    try {
      const [keysData, projectsData, bugsData] = await Promise.all([
        getApiKeys(),
        getProjects(),
        getBugs(),
      ])
      apiKeys = keysData
      projects = projectsData
      bugs = bugsData
    } catch (e) {
      console.error('Failed to load data for integrations page:', e)
    }
  }

  return (
    <IntegrationsClient
      initialApiKeys={apiKeys}
      userEmail={user?.email || ''}
      projects={projects}
      bugs={bugs}
      isGuest={!user}
    />
  )
}
