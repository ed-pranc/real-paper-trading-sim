import { NextResponse } from 'next/server'
import { getFinnhubProfile } from '@/lib/finnhub/client'
import { getTwelveDataEarliestDate } from '@/lib/twelvedata/client'

/**
 * GET /api/market/profile?symbols=AAPL,TSLA,QQQ
 *
 * Returns a map of symbol → first trading date (ISO string) or null.
 * Primary source: Finnhub /stock/profile2 (ipo field — works for equities).
 * Fallback 1: Twelve Data /earliest_timestamp (works for many ETFs).
 * Fallback 2: Static ETF_INCEPTION map for common ETFs where both APIs fail.
 * All sources are cached 7 days — listing dates never change.
 */

/** Known ETF inception dates as a last-resort fallback */
const ETF_INCEPTION: Record<string, string> = {
  QQQ:  '1999-03-10',
  VOO:  '2010-09-07',
  SPY:  '1993-01-22',
  VTI:  '2001-05-24',
  IWM:  '2000-05-22',
  GLD:  '2004-11-18',
  TLT:  '2002-07-26',
  EEM:  '2003-04-14',
  XLF:  '1998-12-22',
  XLK:  '1998-12-22',
  ARKK: '2014-10-31',
}
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
        result[sym] = await getTwelveDataEarliestDate(sym) ?? ETF_INCEPTION[sym] ?? null
      }
    }))

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile fetch failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
