import { createClient } from '@/lib/supabase/server'
import { JournalClient } from '@/components/journal/journal-client'

export const metadata = { title: 'Journal' }

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: entries } = await supabase
    .from('transactions')
    .select('id, symbol, company_name, type, quantity, price, total, pnl, trade_date, simulation_date, notes')
    .eq('user_id', user!.id)
    .not('notes', 'is', null)
    .neq('notes', '')
    .order('trade_date', { ascending: false })

  return <JournalClient entries={entries ?? []} />
}
