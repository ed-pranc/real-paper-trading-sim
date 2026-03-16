import { TradeClient } from './trade-client'

export default function TradePage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string; company?: string }>
}) {
  return <TradeClient />
}
