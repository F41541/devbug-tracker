import { createClient } from '@/lib/supabase/server'
import { getBugs, getProjects } from '@/app/actions'
import DashboardClient from '@/components/DashboardClient'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/project')
  }

  return (
    <DashboardClient
      initialBugs={[]}
      initialProjects={[]}
      userEmail={undefined}
      isGuest={true}
    />
  )
}
