import { NextResponse } from 'next/server'
import { tdFetch } from '@/lib/twelvedata/client'

export interface BatchPriceData {
  price: number
  change: number
  changePct: number
  is_historical: boolean
  fifty_two_week?: { low: string; high: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseQuote(q: any): BatchPriceData {
  return {
    price: parseFloat(q.close ?? q.price ?? '0'),
    change: parseFloat(q.change ?? '0'),
    changePct: parseFloat(q.percent_change ?? '0'),
    is_historical: false,
    fifty_two_week: q.fifty_two_week,
  }
}

/**
 * GET /api/market/prices?symbols=AAPL,MSFT,NVDA&date=2020-06-10
 * Returns price data for all requested symbols in a single Twelve Data call.
 * Uses /quote for live prices and /time_series for historical dates.
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

  const symbolStr = symbolList.join(',')

  try {
    const result: Record<string, BatchPriceData> = {}

    if (date) {
      // Historical: one time_series call for all symbols, outputsize=1 at end_date
      const ts = await tdFetch('/time_series', {
        symbol: symbolStr,
        interval: '1day',
        outputsize: '1',
        end_date: date,
      })

      if (symbolList.length === 1) {
        // Single symbol: response is { meta, values, status }
        const bar = ts?.values?.[0]
        if (bar) {
          result[symbolList[0]] = { price: parseFloat(bar.close), change: 0, changePct: 0, is_historical: true }
        }
      } else {
        // Multi-symbol: response is { AAPL: { meta, values }, MSFT: { meta, values }, ... }
        for (const sym of symbolList) {
          const bar = ts?.[sym]?.values?.[0]
          if (bar) {
            result[sym] = { price: parseFloat(bar.close), change: 0, changePct: 0, is_historical: true }
          }
        }
      }
    } else {
      // Live: one /quote call for all symbols
      const quotes = await tdFetch('/quote', { symbol: symbolStr })

      if (symbolList.length === 1) {
        // Single symbol: response is the quote object itself
        if (quotes?.symbol) result[quotes.symbol] = parseQuote(quotes)
      } else {
        // Multi-symbol: response is { AAPL: {...}, MSFT: {...}, ... }
        for (const sym of symbolList) {
          if (quotes?.[sym]) result[sym] = parseQuote(quotes[sym])
        }
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Price fetch failed'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
