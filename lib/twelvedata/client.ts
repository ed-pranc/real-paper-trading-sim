const BASE_URL = 'https://api.twelvedata.com'
const API_KEY = process.env.TWELVE_DATA_API_KEY!

export async function tdFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('apikey', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Twelve Data error: ${res.status}`)
  return res.json()
}

export async function getQuote(symbol: string, date?: string) {
  if (date) {
    // Historical price: fetch time_series for that date
    const data = await tdFetch('/time_series', {
      symbol,
      interval: '1day',
      start_date: date,
      end_date: date,
      outputsize: '1',
    })
    return data?.values?.[0] ?? null
  }
  return tdFetch('/quote', { symbol })
}

export async function getTimeSeries(
  symbol: string,
  interval: string,
  outputsize: string,
  endDate?: string
) {
  const params: Record<string, string> = { symbol, interval, outputsize }
  if (endDate) params.end_date = endDate
  return tdFetch('/time_series', params)
}

export async function searchSymbol(query: string) {
  return tdFetch('/symbol_search', { symbol: query, outputsize: '10' })
}
