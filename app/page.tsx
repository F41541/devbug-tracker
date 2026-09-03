import { createClient } from '@/lib/supabase/server'
import { getBugs, getProjects } from '@/app/actions'
import { HomeClient } from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialBugs: any[] = []
  let initialProjects: any[] = []

  if (user) {
    try {
      const [bugsData, projectsData] = await Promise.all([getBugs(), getProjects()])
      initialBugs = bugsData
      initialProjects = projectsData
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  return (
    <HomeClient
      initialBugs={initialBugs}
      initialProjects={initialProjects}
      userEmail={user?.email}
      isGuest={!user}
    />
  )
}
