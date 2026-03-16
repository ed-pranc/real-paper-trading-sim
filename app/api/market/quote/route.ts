import { NextResponse } from 'next/server'
import { z } from 'zod'
import { tdFetch } from '@/lib/twelvedata/client'

const QuerySchema = z.object({
  symbol: z.string().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * GET /api/market/quote?symbol=AAPL&date=2024-01-15
 * Returns live quote or historical close price for a given date.
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
    let data
    if (date) {
      const ts = await tdFetch('/time_series', {
        symbol,
        interval: '1day',
        end_date: date,
        outputsize: '1',
      })
      const bar = ts?.values?.[0]
      if (!bar) return NextResponse.json({ error: 'No data for date' }, { status: 404 })
      data = {
        symbol,
        close: bar.close,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        datetime: bar.datetime,
        is_historical: true,
      }
    } else {
      data = await tdFetch('/quote', { symbol })
    }
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Quote failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
