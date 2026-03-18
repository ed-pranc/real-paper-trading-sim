import { NextResponse } from 'next/server'
import { getFinnhubProfile } from '@/lib/finnhub/client'
import { getTwelveDataEarliestDate } from '@/lib/twelvedata/client'

/**
 * GET /api/market/profile?symbols=AAPL,TSLA,QQQ
 *
 * Returns a map of symbol → first trading date (ISO string) or null.
 * Primary source: Finnhub /stock/profile2 (ipo field — works for equities).
 * Fallback: Twelve Data /earliest_timestamp (works for ETFs like QQQ, VOO).
 * Both sources are cached 7 days — listing dates never change.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols') ?? ''

  const symbolList = symbolsParam
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)

  if (symbolList.length === 0) return NextResponse.json({})

  try {
    const profiles = await Promise.all(symbolList.map(sym => getFinnhubProfile(sym)))

    const result: Record<string, string | null> = {}

    await Promise.all(symbolList.map(async (sym, i) => {
      const ipo = profiles[i]?.ipo ?? null
      if (ipo) {
        result[sym] = ipo
      } else {
        // Finnhub doesn't populate ipo for ETFs — fall back to Twelve Data earliest_timestamp
        result[sym] = await getTwelveDataEarliestDate(sym)
      }
    }))

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile fetch failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
