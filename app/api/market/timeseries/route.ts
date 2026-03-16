import { NextResponse } from 'next/server'
import { tdFetch } from '@/lib/twelvedata/client'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const interval = searchParams.get('interval') ?? '1h'
  const outputsize = searchParams.get('outputsize') ?? '24'
  const end_date = searchParams.get('end_date') ?? ''

  if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 })

  try {
    const params: Record<string, string> = { symbol, interval, outputsize }
    if (end_date) params.end_date = end_date
    const data = await tdFetch('/time_series', params)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Time series failed' }, { status: 500 })
  }
}
