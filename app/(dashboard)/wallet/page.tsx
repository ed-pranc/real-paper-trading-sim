import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWalletSummary } from '@/lib/actions/wallet'
import { WalletClient } from './wallet-client'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const summary = await getWalletSummary(user.id)

  return <WalletClient summary={summary} />
}
