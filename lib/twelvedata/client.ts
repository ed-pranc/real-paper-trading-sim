const BASE_URL = 'https://api.twelvedata.com'
const API_KEY = process.env.TWELVE_DATA_API_KEY!

/**
 * Low-level fetch wrapper for the Twelve Data REST API.
 * @param {string} endpoint - API endpoint path, e.g. '/quote'
 * @param {Record<string, string>} params - Query parameters to append
 * @returns {Promise<unknown>} Parsed JSON response
 */
export async function tdFetch(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('apikey', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Twelve Data HTTP error: ${res.status}`)

  const json = await res.json()
  // Twelve Data returns errors as HTTP 200 with { status: "error", code: N, message: "..." }
  if (json?.status === 'error') {
    throw new Error(json.message ?? `Twelve Data error code ${json.code}`)
  }

  return json
}

/**
 * Fetch a live quote or historical closing price for a symbol.
 * @param {string} symbol - Ticker symbol, e.g. 'AAPL'
 * @param {string} [date] - ISO date string for historical price; omit for live
 * @returns {Promise<unknown>} Quote or time series bar object
 */
export async function getQuote(symbol: string, date?: string) {
  if (date) {
    const data = await tdFetch('/time_series', {
      symbol,
      interval: '1day',
      end_date: date,
      outputsize: '1',
    })
    return data?.values?.[0] ?? null
  }
  return tdFetch('/quote', { symbol })
}

/**
 * Fetch OHLCV time series data for charting.
 * @param {string} symbol - Ticker symbol
 * @param {string} interval - Time interval, e.g. '1h', '1day'
 * @param {string} outputsize - Number of data points to return
 * @param {string} [endDate] - Optional ISO date to end the series at
 * @returns {Promise<unknown>} Time series response from Twelve Data
 */
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

/**
 * Search for symbols matching a query string.
 * @param {string} query - Search term (symbol or company name)
 * @returns {Promise<unknown>} Symbol search results from Twelve Data
 */
export async function searchSymbol(query: string) {
  return tdFetch('/symbol_search', { symbol: query, outputsize: '10' })
}
