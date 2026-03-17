import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getTimeSeries } from '@/lib/twelvedata/client'

const QuerySchema = z.object({
  symbol: z.string().min(1).max(20),
  interval: z.enum(['1min', '5min', '15min', '30min', '45min', '1h', '2h', '4h', '8h', '1day', '1week', '1month']).default('1h'),
  outputsize: z.string().regex(/^\d+$/).default('24'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/** Cache strategy: historical data never changes (24h); live data by interval granularity */
function revalidateFor(interval: string, isHistorical: boolean): number {
  if (isHistorical) return 86400
  if (['15min', '30min', '45min', '1min', '5min'].includes(interval)) return 300   // 5 min
  if (['1h', '2h', '4h', '8h'].includes(interval)) return 900                      // 15 min
  if (interval === '1day') return 3600                                              // 1 hour
  return 86400                                                                      // weekly/monthly
}

/**
 * GET /api/market/timeseries?symbol=AAPL&interval=1h&outputsize=24&end_date=2024-01-15
 * Returns OHLCV time series data for charting via Twelve Data.
 * Cache is tuned per interval: intraday 5–15 min, daily 1 h, weekly/monthly 24 h.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = QuerySchema.safeParse({
    symbol: searchParams.get('symbol') ?? undefined,
    interval: searchParams.get('interval') ?? undefined,
    outputsize: searchParams.get('outputsize') ?? undefined,
    end_date: searchParams.get('end_date') ?? undefined,
  })

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const { symbol, interval, outputsize, end_date } = result.data
  const revalidate = revalidateFor(interval, !!end_date)

  try {
    const data = await getTimeSeries(symbol, interval, outputsize, end_date, revalidate)
    return NextResponse.json({ values: data?.values ?? [] })
  } catch (err) {
    console.error(`[timeseries] ${symbol} ${interval}: ${err}`)
    return NextResponse.json({ error: 'Time series failed' }, { status: 500 })
  }
}
