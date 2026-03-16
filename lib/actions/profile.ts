'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveProfile(formData: {
  nickname: string
  first_name: string
  last_name: string
  address_1: string
  address_2: string
  city: string
  postal_code: string
  country: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('user_profile')
    .upsert(
      { user_id: user.id, ...formData, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  revalidatePath('/', 'layout')
}
