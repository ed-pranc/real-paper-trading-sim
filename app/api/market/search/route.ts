import { NextResponse } from 'next/server'
import { z } from 'zod'
import { searchSymbol } from '@/lib/twelvedata/client'

const QuerySchema = z.object({
  q: z.string().min(1).max(100),
})

/**
 * GET /api/market/search?q=Apple
 * Returns matching symbols from Twelve Data symbol search.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = QuerySchema.safeParse({ q: searchParams.get('q') ?? undefined })

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  try {
    const data = await searchSymbol(result.data.q)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
