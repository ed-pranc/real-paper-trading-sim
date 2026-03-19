import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HomeClient } from './home-client'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { count: watchlistCount },
    { count: tradeCount },
    { count: simTradeCount },
    { count: depositCount },
  ] = await Promise.all([
    supabase
      .from('user_profile')
      .select('nickname')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('simulation_date', 'is', null),
    supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('type', 'deposit'),
  ])

  const nickname = profile?.nickname ?? user.email?.split('@')[0] ?? 'Trader'

  return (
    <HomeClient
      nickname={nickname}
      hasDeposit={(depositCount ?? 0) > 0}
      watchlistCount={watchlistCount ?? 0}
      tradeCount={tradeCount ?? 0}
      simulationUsed={(simTradeCount ?? 0) > 0}
    />
  )
}
