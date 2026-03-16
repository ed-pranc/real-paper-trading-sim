import { NextResponse } from 'next/server'
import { z } from 'zod'
import { tdFetch } from '@/lib/twelvedata/client'

const QuerySchema = z.object({
  symbol: z.string().min(1).max(20),
})

/**
 * GET /api/market/logo?symbol=AAPL
 * Returns the company logo URL from Twelve Data. Cached for 24 hours.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = QuerySchema.safeParse({ symbol: searchParams.get('symbol') ?? undefined })

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  try {
    const data = await tdFetch('/logo', { symbol: result.data.symbol })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' },
    })
  } catch {
    return NextResponse.json({ error: 'Logo fetch failed' }, { status: 500 })
  }
}
