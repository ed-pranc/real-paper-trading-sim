import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from './dashboard-shell'
import { ProfileCompletionGate } from '@/components/profile/profile-completion-gate'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profile')
    .select('nickname, first_name, last_name, address_1, address_2, city, postal_code, country')
    .eq('user_id', user.id)
    .single()

  const nickname = profile?.nickname ?? user.email?.split('@')[0] ?? 'Trader'
  const email = user.email ?? ''

  const profileComplete = !!(profile?.nickname?.trim())

  return (
    <DashboardShell userId={user.id} nickname={nickname} profile={profile ?? null} email={email}>
      <ProfileCompletionGate profileComplete={profileComplete} profile={profile ?? null} email={email}>
        {children}
      </ProfileCompletionGate>
    </DashboardShell>
  )
}
