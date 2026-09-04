import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProjectByUuid, getProjects, getBugs } from '@/app/actions'
import { getApiKeys } from '@/app/settings/actions'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

interface ProjectWorkspacePageProps {
  params: Promise<{
    uuid: string
  }>
}

export default async function ProjectWorkspacePage({ params }: ProjectWorkspacePageProps) {
  const { uuid } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const project = await getProjectByUuid(uuid)
  if (!project) {
    notFound()
  }

  const [allProjects, allBugs, apiKeys] = await Promise.all([
    getProjects(),
    getBugs(),
    getApiKeys().catch(() => []),
  ])

  return (
    <DashboardClient
      initialBugs={allBugs}
      initialProjects={allProjects}
      initialSelectedProjectId={project.id}
      userEmail={user.email}
      isGuest={false}
      fixedWorkspace={true}
      initialApiKeys={apiKeys}
    />
  )
}
