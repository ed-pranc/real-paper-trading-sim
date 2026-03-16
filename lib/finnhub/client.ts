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
