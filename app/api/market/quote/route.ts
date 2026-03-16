import { NextResponse } from 'next/server'
import { tdFetch } from '@/lib/twelvedata/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const date = searchParams.get('date') // simulation date, optional

  if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })

  try {
    let data
    if (date) {
      // Historical: get closing price for that date
      const ts = await tdFetch('/time_series', {
        symbol,
        interval: '1day',
        start_date: date,
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
  } catch (e) {
    return NextResponse.json({ error: 'Quote failed' }, { status: 500 })
  }
}
