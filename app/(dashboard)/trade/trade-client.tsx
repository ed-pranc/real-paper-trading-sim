'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StockChart } from '@/components/trade/stock-chart'
import { BuySellModal } from '@/components/trade/buy-sell-modal'
import { useSimulationDate } from '@/context/simulation-date'
import { Loader2, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { SymbolAvatar } from '@/components/ui/symbol-avatar'
import { StockDetailSheet } from '@/components/stock/stock-detail-sheet'

interface SearchResult {
  symbol: string
  instrument_name: string
  exchange: string
  instrument_type: string
}

interface QuoteData {
  symbol: string
  close?: string
  price?: string
  change?: string
  percent_change?: string
  datetime?: string
  is_historical?: boolean
}

export function TradeClient({ initialSymbol }: { initialSymbol?: string }) {
  const { simulationDate } = useSimulationDate()
  const router = useRouter()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const [symbol, setSymbol] = useState(initialSymbol ?? '')
  const [companyName, setCompanyName] = useState('')
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'buy' | 'sell'>('buy')

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); setShowDropdown(false); return }
    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data?.data?.slice(0, 8) ?? [])
        setShowDropdown(true)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const fetchQuote = useCallback(async () => {
    if (!symbol) return
    setQuoteLoading(true)
    try {
      const dateParam = simulationDate ? `&date=${simulationDate}` : ''
      const res = await fetch(`/api/market/quote?symbol=${symbol}${dateParam}`)
      const data = await res.json()
      if (!res.ok) { setQuote(null); return }
      setQuote(data)
      setLastUpdated(new Date().toLocaleTimeString())
    } finally {
      setQuoteLoading(false)
    }
  }, [symbol, simulationDate])

  useEffect(() => {
    fetchQuote()
    if (!simulationDate) {
      const interval = setInterval(fetchQuote, 60_000)
      return () => clearInterval(interval)
    }
  }, [fetchQuote])

  function selectSymbol(sym: string, name: string) {
    setSymbol(sym)
    setCompanyName(name)
    setQuery('')
    setShowDropdown(false)
  }

  const price = parseFloat(quote?.close ?? quote?.price ?? '0')
  const change = parseFloat(quote?.change ?? '0')
  const pctChange = parseFloat(quote?.percent_change ?? '0')
  const positive = change >= 0

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Full-width header */}
      <div className="col-span-12">
        <h1 className="text-2xl font-bold">Trade</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search any stock and execute orders at live or historical prices.
        </p>
      </div>

      {/* Left panel: search + asset info + buy/sell (col-4) */}
      <div className="col-span-12 lg:col-span-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbol or company…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="pl-9"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg overflow-hidden">
              {results.map(r => (
                <button
                  key={`${r.symbol}-${r.exchange}`}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                  onMouseDown={() => selectSymbol(r.symbol, r.instrument_name)}
                >
                  <SymbolAvatar symbol={r.symbol} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{r.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.instrument_name}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{r.exchange}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Asset info + price + buy/sell — shown when symbol selected */}
        {symbol && (
          <Card>
            <CardContent className="pt-5 space-y-4">
              {/* Symbol header */}
              <StockDetailSheet symbol={symbol} companyName={companyName} simulationDate={simulationDate}>
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <SymbolAvatar symbol={symbol} size={40} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold">{symbol}</h2>
                      {simulationDate && (
                        <Badge variant="secondary" className="text-xs">SIM</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{companyName}</p>
                  </div>
                </div>
              </StockDetailSheet>

              {/* Price */}
              <div>
                {quoteLoading && !quote ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold">${price.toFixed(2)}</p>
                      {quoteLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {!quote?.is_historical && (
                      <div className={`flex items-center gap-1 text-sm mt-1 ${positive ? 'text-green-500' : 'text-red-500'}`}>
                        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span>{positive ? '+' : ''}{change.toFixed(2)}</span>
                        <span>({positive ? '+' : ''}{pctChange.toFixed(2)}%)</span>
                      </div>
                    )}
                    {lastUpdated && (
                      <p className="text-xs text-muted-foreground mt-1">Updated {lastUpdated}</p>
                    )}
                  </>
                )}
              </div>

              {/* Buy / Sell buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  className="rounded-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={!price}
                  onClick={() => { setModalMode('buy'); setModalOpen(true) }}
                >
                  Buy
                </Button>
                <Button
                  className="rounded-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={!price}
                  onClick={() => { setModalMode('sell'); setModalOpen(true) }}
                >
                  Sell
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right panel: chart or empty state (col-8) */}
      <div className="col-span-12 lg:col-span-8">
        {symbol ? (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Price Chart — {symbol}</CardTitle>
            </CardHeader>
            <CardContent>
              <StockChart symbol={symbol} simulationDate={simulationDate} />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-80 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Search for a stock to trade</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Enter a symbol or company name on the left to view prices and place orders
            </p>
          </div>
        )}
      </div>

      <BuySellModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); router.refresh() }}
        symbol={symbol}
        companyName={companyName}
        price={price}
      />
    </div>
  )
}
