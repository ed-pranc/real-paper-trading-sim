import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRecommendations } from '@/lib/finnhub/client'

const schema = z.object({
  symbol: z.string().min(1).max(20),
})

function deriveConsensus(r: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }) {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell
  if (total === 0) return 'N/A'
  const score =
    (r.strongBuy * 5 + r.buy * 4 + r.hold * 3 + r.sell * 2 + r.strongSell * 1) / total
  if (score >= 4.5) return 'Strong Buy'
  if (score >= 3.5) return 'Buy'
  if (score >= 2.5) return 'Hold'
  if (score >= 1.5) return 'Sell'
  return 'Strong Sell'
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = schema.safeParse({ symbol: searchParams.get('symbol') ?? undefined })
  if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  try {
    const rec = await getRecommendations(parsed.data.symbol)
    if (!rec) return NextResponse.json(null)

    return NextResponse.json({
      ...rec,
      consensus: deriveConsensus(rec),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 })
  }
}
