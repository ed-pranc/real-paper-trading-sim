import { createClient } from '@/lib/supabase/server'
import { HistoryClient } from '@/components/history/history-client'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, symbol, company_name, type, quantity, price, total, pnl, trade_date, simulation_date')
    .eq('user_id', user!.id)
    .order('trade_date', { ascending: false })

  return <HistoryClient transactions={transactions ?? []} />
}
