'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ProfileSchema = z.object({
  nickname: z.string().min(1).max(50),
  first_name: z.string().max(100),
  last_name: z.string().max(100),
  address_1: z.string().max(200),
  address_2: z.string().max(200),
  city: z.string().max(100),
  postal_code: z.string().max(20),
  country: z.string().max(10),
})

/**
 * Save or update the user's profile in user_profile table.
 * @param {object} formData - Profile fields to upsert
 * @returns {Promise<void>}
 */
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
  const parsed = ProfileSchema.parse(formData)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('user_profile')
    .upsert(
      { user_id: user.id, ...parsed, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  revalidatePath('/', 'layout')
}
