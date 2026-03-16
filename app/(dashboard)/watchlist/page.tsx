import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WatchlistClient } from './watchlist-client'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('watchlist')
    .select('symbol, company_name, added_at')
    .eq('user_id', user.id)
    .order('added_at', { ascending: true })

  return <WatchlistClient items={items ?? []} />
}
