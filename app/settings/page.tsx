import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/SettingsClient'
import { getApiKeys } from '@/app/settings/actions'
import { getProjects, getBugs } from '@/app/actions'
import { Project, BugItem } from '@/types'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let apiKeys: any[] = []
  let projects: Project[] = []
  let bugs: BugItem[] = []

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
    console.error('Failed to load data for settings page:', e)
  }

  return (
    <SettingsClient
      userId={user.id}
      userEmail={user.email || ''}
      createdAt={user.created_at}
      initialApiKeys={apiKeys}
      projects={projects}
      bugs={bugs}
      isGuest={false}
    />
  )
}
