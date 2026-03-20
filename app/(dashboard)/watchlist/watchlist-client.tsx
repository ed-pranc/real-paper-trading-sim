'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SearchModal } from '@/components/watchlist/search-modal'
import { WatchlistRow } from '@/components/watchlist/watchlist-row'
import { useSimulationDate } from '@/context/simulation-date'
import { Plus, Eye, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import type { BatchPriceData } from '@/app/api/market/prices/route'

interface WatchlistItem {
  symbol: string
  company_name: string
  added_at: string
}

type SortCol = 'market' | 'change' | 'price' | 'tradingSince'

const DEFAULT_DIR: Record<SortCol, 'asc' | 'desc'> = {
  market:       'asc',
  change:       'desc',
  price:        'desc',
  tradingSince: 'asc',
}

function SortHeader({
  col, label, currentCol, dir, onSort,
}: {
  col: SortCol
  label: string
  currentCol: SortCol | null
  dir: 'asc' | 'desc'
  onSort: (col: SortCol) => void
}) {
  const active = col === currentCol
  return (
    <button
      onClick={() => onSort(col)}
      className="flex items-center gap-1 hover:text-foreground transition-colors whitespace-nowrap"
    >
      {label}
      {active
        ? dir === 'asc'
          ? <ArrowUp className="h-3 w-3" />
          : <ArrowDown className="h-3 w-3" />
        : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  )
}

export function WatchlistClient({ items }: { items: WatchlistItem[] }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const { simulationDate } = useSimulationDate()

  const [prices, setPrices] = useState<Record<string, BatchPriceData>>({})
  const [priceLoading, setPriceLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [listedDates, setListedDates] = useState<Record<string, string | null>>({})

  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const symbols = items.map(i => i.symbol).join(',')

  const toggleSort = useCallback((col: SortCol) => {
    setSortCol(prev => {
      if (prev === col) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        return col
      }
      setSortDir(DEFAULT_DIR[col])
      return col
    })
  }, [])

  const sortedItems = useMemo(() => {
    if (!sortCol) return items
    return [...items].sort((a, b) => {
      let aVal: string | number
      let bVal: string | number
      switch (sortCol) {
        case 'market':
          aVal = a.symbol; bVal = b.symbol; break
        case 'change':
          aVal = prices[a.symbol]?.change ?? 0
          bVal = prices[b.symbol]?.change ?? 0; break
        case 'price':
          aVal = prices[a.symbol]?.price ?? 0
          bVal = prices[b.symbol]?.price ?? 0; break
        case 'tradingSince':
          aVal = listedDates[a.symbol] ?? '9999-12-31'
          bVal = listedDates[b.symbol] ?? '9999-12-31'; break
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [items, sortCol, sortDir, prices, listedDates])

  const fetchPrices = useCallback(async () => {
    if (!symbols) return
    setPriceLoading(true)
    try {
      const dateParam = simulationDate ? `&date=${encodeURIComponent(simulationDate)}` : ''
      const res = await fetch(`/api/market/prices?symbols=${encodeURIComponent(symbols)}${dateParam}`)
      const data = await res.json()
      if (!res.ok || data?.error) {
        toast.error('Price data unavailable', { description: data?.error ?? 'Failed to load prices' })
      } else {
        setPrices(data)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch {
      toast.error('Price data unavailable', { description: 'Failed to connect to price service' })
    } finally {
      setPriceLoading(false)
    }
  }, [symbols, simulationDate])

  useEffect(() => {
    fetchPrices()
    // Only auto-refresh in live mode — sim prices are historical (fixed for a given date)
    if (simulationDate) return
    const interval = setInterval(fetchPrices, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrices, simulationDate])

  useEffect(() => {
    if (!symbols) return
    fetch(`/api/market/profile?symbols=${encodeURIComponent(symbols)}`)
      .then(r => r.json())
      .then(data => { if (!data?.error) setListedDates(data) })
      .catch(() => {})
  }, [symbols])

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Full-width header row: title left, add button right */}
      <div className="col-span-12 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Watchlist</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track live and historical prices for your saved markets. Click any row to view the price chart, analyst ratings, and live news — then trade directly.
          </p>
        </div>
        <Button
          onClick={() => setSearchOpen(true)}
          className="rounded-full bg-green-600 hover:bg-green-700 shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Markets
        </Button>
      </div>

      {/* Full-width table or empty state */}
      <div className="col-span-12">
        {items.length > 0 ? (
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortHeader col="market" label="Market" currentCol={sortCol} dir={sortDir} onSort={toggleSort} />
                  </TableHead>
                  <TableHead>
                    <SortHeader col="change" label="Change 1D" currentCol={sortCol} dir={sortDir} onSort={toggleSort} />
                  </TableHead>
                  <TableHead className="w-56">1Y Chart</TableHead>
                  <TableHead>
                    <SortHeader col="price" label="Price" currentCol={sortCol} dir={sortDir} onSort={toggleSort} />
                  </TableHead>
                  <TableHead>52W Range</TableHead>
                  <TableHead>
                    <SortHeader col="tradingSince" label="Trading Since" currentCol={sortCol} dir={sortDir} onSort={toggleSort} />
                  </TableHead>
                  <TableHead className="text-right">
                    {lastUpdated && (
                      <span className="text-[10px] font-normal text-muted-foreground">
                        Updated {lastUpdated}
                      </span>
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <WatchlistRow
                    key={item.symbol}
                    symbol={item.symbol}
                    companyName={item.company_name}
                    priceData={prices[item.symbol]}
                    priceLoading={priceLoading && !prices[item.symbol]}
                    simulationDate={simulationDate}
                    listedDate={listedDates[item.symbol] ?? null}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Eye className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Your watchlist is empty</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-6">
              Search and add stocks to monitor their prices
            </p>
            <Button
              onClick={() => setSearchOpen(true)}
              className="rounded-full bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add your first stock
            </Button>
          </div>
        )}
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
