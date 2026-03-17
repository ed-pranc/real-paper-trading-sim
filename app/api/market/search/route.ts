import { NextResponse } from 'next/server'
import { z } from 'zod'
import { searchSymbols } from '@/lib/finnhub/client'

const QuerySchema = z.object({
  q: z.string().min(1).max(100),
})

/**
 * GET /api/market/search?q=Apple
 * Returns matching symbols via Finnhub search — no daily credit cost.
 * Response is mapped to the same shape as the previous Twelve Data response.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = QuerySchema.safeParse({ q: searchParams.get('q') ?? undefined })

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  try {
    const data = await searchSymbols(result.data.q)
    // Map Finnhub shape → Twelve Data shape the frontend expects
    const mapped = (data?.result ?? []).slice(0, 10).map((r: {
      symbol: string; displaySymbol?: string; description: string; type: string; exchange?: string
    }) => ({
      symbol: r.displaySymbol || r.symbol,
      instrument_name: r.description,
      exchange: r.exchange ?? '',
      instrument_type: r.type,
    }))
    return NextResponse.json({ data: mapped })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
