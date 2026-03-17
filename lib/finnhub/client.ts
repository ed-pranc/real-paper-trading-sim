const BASE_URL = 'https://finnhub.io/api/v1'
const API_KEY = process.env.FINNHUB_API_KEY!

export async function finnhubFetch(endpoint: string, params: Record<string, string>, revalidate = 3600) {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('token', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate } })
  if (!res.ok) throw new Error(`Finnhub HTTP error: ${res.status}`)

  return res.json()
}

export interface FinnhubQuote {
  c: number   // current price
  d: number   // change
  dp: number  // percent change
  h: number   // day high
  l: number   // day low
  o: number   // open
  pc: number  // previous close
  t: number   // timestamp
}

/** Live quote from Finnhub — no daily credit cost */
export async function getFinnhubQuote(symbol: string): Promise<FinnhubQuote> {
  return finnhubFetch('/quote', { symbol }, 60)
}

export interface RecommendationTrend {
  period: string
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
}

export async function getRecommendations(symbol: string): Promise<RecommendationTrend | null> {
  const data: RecommendationTrend[] = await finnhubFetch('/stock/recommendation', { symbol })
  if (!Array.isArray(data) || data.length === 0) return null
  return data[0] // most recent period first
}

export interface FinnhubNewsArticle {
  headline: string
  url: string
  source: string
  datetime: number  // Unix timestamp (seconds)
  summary: string
  image: string
}

export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<FinnhubNewsArticle[]> {
  const data = await finnhubFetch('/company-news', { symbol, from, to }, 300)
  return Array.isArray(data) ? data : []
}

// Finnhub resolution codes for each interval
const INTERVAL_TO_RESOLUTION: Record<string, string> = {
  '15min': '15', '30min': '30', '1h': '60',
  '1day': 'D', '1week': 'W', '1month': 'M',
}

// Approximate interval duration in seconds (used to compute `from` timestamp)
const INTERVAL_SECONDS: Record<string, number> = {
  '15min': 900, '30min': 1800, '1h': 3600,
  '1day': 86400, '1week': 604800, '1month': 2592000,
}

/**
 * Fetch OHLCV candles from Finnhub — no daily credit limit.
 * Returns data in the same shape the portfolio chart expects: { datetime, close }[].
 * @param symbol   Ticker symbol, e.g. 'AAPL'
 * @param interval Twelve Data-style interval ('1day', '1week', '1month', '1h', '15min')
 * @param outputsize Number of bars to return
 * @param endDate  ISO date string (YYYY-MM-DD) for the end of the series; defaults to today
 */
export async function getStockCandles(
  symbol: string,
  interval: string,
  outputsize: number,
  endDate?: string,
): Promise<{ datetime: string; close: string }[]> {
  const resolution = INTERVAL_TO_RESOLUTION[interval] ?? 'D'
  const toTs = endDate
    ? Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000)
    : Math.floor(Date.now() / 1000)
  const intervalSecs = INTERVAL_SECONDS[interval] ?? 86400
  const fromTs = toTs - intervalSecs * outputsize

  // Historical candles are immutable; live candles refresh every 60s
  const revalidate = endDate ? 86400 : 60
  const data = await finnhubFetch('/stock/candle', {
    symbol,
    resolution,
    from: String(fromTs),
    to: String(toTs),
  }, revalidate)

  if (data?.s !== 'ok' || !Array.isArray(data.c)) return []

  const isIntraday = ['15min', '30min', '1h', '2h', '4h', '8h'].includes(interval)
  return (data.t as number[]).map((ts: number, i: number) => ({
    datetime: isIntraday
      ? new Date(ts * 1000).toISOString().slice(0, 16).replace('T', ' ')
      : new Date(ts * 1000).toISOString().slice(0, 10),
    close: String((data.c as number[])[i]),
  }))
}
