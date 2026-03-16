import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from './dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profile')
    .select('nickname')
    .eq('user_id', user.id)
    .single()

  const nickname = profile?.nickname ?? user.email?.split('@')[0] ?? 'Trader'

  return (
    <DashboardShell userId={user.id} nickname={nickname}>
      {children}
    </DashboardShell>
  )
}
