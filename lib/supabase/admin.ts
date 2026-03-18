import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with the service role key.
 * ONLY use in server-side code (Server Actions, Route Handlers).
 * Never expose to the client — the service role key has full DB access.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
