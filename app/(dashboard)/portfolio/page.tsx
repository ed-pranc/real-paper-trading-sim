import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortfolioClient } from './portfolio-client'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: positions }, { data: snapshots }] = await Promise.all([
    supabase
      .from('positions')
      .select('symbol, company_name, quantity, avg_buy_price, opened_at')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: true }),
    supabase
      .from('portfolio_snapshots')
      .select('snapshot_date, total_value, cash, invested')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true }),
  ])

  return <PortfolioClient positions={positions ?? []} snapshots={snapshots ?? []} />
}
