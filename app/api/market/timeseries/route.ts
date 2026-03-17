import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStockCandles } from '@/lib/finnhub/client'
import { getTimeSeries } from '@/lib/twelvedata/client'

const QuerySchema = z.object({
  symbol: z.string().min(1).max(20),
  interval: z.enum(['1min', '5min', '15min', '30min', '45min', '1h', '2h', '4h', '8h', '1day', '1week', '1month']).default('1h'),
  outputsize: z.string().regex(/^\d+$/).default('24'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * GET /api/market/timeseries?symbol=AAPL&interval=1h&outputsize=24&end_date=2024-01-15
 * Returns OHLCV time series data for charting.
 * Uses Finnhub /stock/candle — no daily credit limit (vs Twelve Data 800/day).
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

  try {
    const values = await getStockCandles(symbol, interval, Number(outputsize), end_date)

    if (values.length > 0) {
      return NextResponse.json({ values })
    }

    // Finnhub returned no data — fall back to Twelve Data (cached 24h for live, 24h for historical)
    console.warn(`[timeseries] Finnhub returned empty for ${symbol} ${interval} — falling back to Twelve Data`)
    const revalidate = end_date ? 86400 : 300
    const td = await getTimeSeries(symbol, interval, String(outputsize), end_date, revalidate)
    return NextResponse.json({ values: td?.values ?? [] })
  } catch {
    return NextResponse.json({ error: 'Time series failed' }, { status: 500 })
  }
}
