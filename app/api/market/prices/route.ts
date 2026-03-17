import { NextResponse } from 'next/server'
import { tdFetch } from '@/lib/twelvedata/client'
import { getFinnhubQuote } from '@/lib/finnhub/client'

export interface BatchPriceData {
  price: number
  change: number
  changePct: number
  is_historical: boolean
  fifty_two_week?: { low: string; high: string }
}

/**
 * GET /api/market/prices?symbols=AAPL,MSFT,NVDA&date=2020-06-10
 * Live mode uses Finnhub (no daily credit limit).
 * Sim mode uses Twelve Data time_series (cached 24h — historical prices never change).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get('symbols') ?? ''
  const date = searchParams.get('date') ?? undefined

  const symbolList = symbolsParam
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)

  if (symbolList.length === 0) return NextResponse.json({})

  try {
    const result: Record<string, BatchPriceData> = {}

    if (date) {
      // Sim mode: one Twelve Data time_series call for all symbols, cached 24h
      const symbolStr = symbolList.join(',')
      const ts = await tdFetch('/time_series', {
        symbol: symbolStr,
        interval: '1day',
        outputsize: '1',
        end_date: date,
      }, 86400)

      if (symbolList.length === 1) {
        const bar = ts?.values?.[0]
        if (bar) {
          result[symbolList[0]] = { price: parseFloat(bar.close), change: 0, changePct: 0, is_historical: true }
        }
      } else {
        for (const sym of symbolList) {
          const bar = ts?.[sym]?.values?.[0]
          if (bar) {
            result[sym] = { price: parseFloat(bar.close), change: 0, changePct: 0, is_historical: true }
          }
        }
      }
    } else {
      // Live mode: Finnhub quotes in parallel — no daily credit limit
      const quotes = await Promise.all(symbolList.map(sym => getFinnhubQuote(sym).catch(() => null)))
      symbolList.forEach((sym, i) => {
        const q = quotes[i]
        if (q && q.c > 0) {
          result[sym] = { price: q.c, change: q.d, changePct: q.dp, is_historical: false }
        }
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Price fetch failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
