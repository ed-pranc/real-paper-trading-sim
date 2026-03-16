import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortfolioClient } from './portfolio-client'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: positions } = await supabase
    .from('positions')
    .select('symbol, company_name, quantity, avg_buy_price, opened_at')
    .eq('user_id', user.id)
    .order('opened_at', { ascending: true })

  return <PortfolioClient positions={positions ?? []} />
}
