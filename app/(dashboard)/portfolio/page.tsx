import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortfolioClient } from './portfolio-client'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: snapshots }, { data: transactions }] = await Promise.all([
    supabase
      .from('portfolio_snapshots')
      .select('snapshot_date, total_value, cash, invested')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: true }),
    supabase
      .from('transactions')
      .select('symbol, company_name, type, quantity, price, simulation_date, trade_date')
      .eq('user_id', user.id)
      .order('trade_date', { ascending: true }),
  ])

  return (
    <PortfolioClient
      snapshots={snapshots ?? []}
      transactions={transactions ?? []}
    />
  )
}
