import { createClient } from '@/lib/supabase/server'
import { getProjects, getBugs } from '@/app/actions'
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

  try {
    const [p, b] = await Promise.all([getProjects(), getBugs()])
    projects = p
    bugs = b
  } catch (err) {
    console.error('Failed to load projects page data:', err)
  }

  return (
    <ProjectsPageClient
      initialProjects={projects}
      initialBugs={bugs}
      userEmail={user.email}
    />
  )
}
