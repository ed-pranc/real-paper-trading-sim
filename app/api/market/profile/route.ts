import { NextResponse } from 'next/server'
import { getFinnhubProfile } from '@/lib/finnhub/client'

/**
 * GET /api/market/profile?symbols=AAPL,TSLA,QQQ
 *
 * Returns a map of symbol → IPO/inception date (ISO string) or null.
 * Listing dates are immutable — responses are cached 7 days via finnhubFetch.
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
    symbolList.forEach((sym, i) => {
      result[sym] = profiles[i]?.ipo ?? null
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile fetch failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
