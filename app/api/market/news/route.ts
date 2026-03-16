import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCompanyNews } from '@/lib/finnhub/client'

const schema = z.object({
  symbol: z.string().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = schema.safeParse({
    symbol: searchParams.get('symbol') ?? undefined,
    date: searchParams.get('date') ?? undefined,
  })
  if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  const { symbol, date } = parsed.data

  try {
    const to = date ?? toYMD(new Date())
    const fromDate = new Date(to)
    fromDate.setDate(fromDate.getDate() - 7)
    const from = toYMD(fromDate)

    const articles = await getCompanyNews(symbol, from, to)

    const items = articles.slice(0, 8).map(a => ({
      title: a.headline,
      url: a.url,
      source: a.source,
      published_at: new Date(a.datetime * 1000).toISOString(),
      snippet: a.summary ?? '',
    }))

    return NextResponse.json(items)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 })
  }
}
