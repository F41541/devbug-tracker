import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from '@/components/AccountClient'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <AccountClient
      userId={user.id}
      userEmail={user.email || ''}
      createdAt={user.created_at}
    />
  )
}
