import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getFinnhubQuote } from '@/lib/finnhub/client'
import { tdFetch } from '@/lib/twelvedata/client'

const QuerySchema = z.object({
  symbol: z.string().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * GET /api/market/quote?symbol=AAPL&date=2024-01-15
 *
 * Live mode  → Finnhub /quote  (no daily credit cost, 60 req/min)
 * Sim mode   → Twelve Data /time_series at the given date (supports date strings)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = QuerySchema.safeParse({
    symbol: searchParams.get('symbol') ?? undefined,
    date: searchParams.get('date') ?? undefined,
  })

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const { symbol, date } = result.data

  try {
    if (date) {
      // Historical / simulation mode — Twelve Data time_series
      // Historical data is immutable; cache for 24 hours to conserve API credits
      const ts = await tdFetch('/time_series', {
        symbol,
        interval: '1day',
        end_date: date,
        outputsize: '1',
      }, 86400)
      const bar = ts?.values?.[0]
      if (!bar) return NextResponse.json({ error: 'No data for date' }, { status: 404 })
      return NextResponse.json({
        symbol,
        close: bar.close,
        price: bar.close,
        open: bar.open,
        day_high: bar.high,
        day_low: bar.low,
        datetime: bar.datetime,
        is_historical: true,
      })
    }

    // Live mode — Finnhub (no daily cap)
    // q.c is 0 outside trading hours; fall back to q.pc (previous close) so P/L is always meaningful
    const q = await getFinnhubQuote(symbol)
    const livePrice = q.c || q.pc
    if (!livePrice) return NextResponse.json({ error: 'No quote data' }, { status: 404 })

    return NextResponse.json({
      symbol,
      price: String(livePrice),
      close: String(livePrice),
      change: String(q.d),
      percent_change: String(q.dp),
      day_high: String(q.h),
      day_low: String(q.l),
      open: String(q.o),
      previous_close: String(q.pc),
      is_historical: false,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Quote failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
