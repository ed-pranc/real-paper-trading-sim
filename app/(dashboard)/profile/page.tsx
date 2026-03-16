import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profile')
    .select('nickname, first_name, last_name, address_1, address_2, city, postal_code, country')
    .eq('user_id', user!.id)
    .single()

  return <ProfileForm profile={profile} email={user!.email ?? ''} />
}
