'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { SearchModal } from '@/components/watchlist/search-modal'
import { WatchlistRow } from '@/components/watchlist/watchlist-row'
import { useSimulationDate } from '@/context/simulation-date'
import { Plus, Eye } from 'lucide-react'
import { toast } from 'sonner'
import type { BatchPriceData } from '@/app/api/market/prices/route'

interface WatchlistItem {
  symbol: string
  company_name: string
  added_at: string
}

export function WatchlistClient({ items }: { items: WatchlistItem[] }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const { simulationDate } = useSimulationDate()

  const [prices, setPrices] = useState<Record<string, BatchPriceData>>({})
  const [priceLoading, setPriceLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const symbols = items.map(i => i.symbol).join(',')

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

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Full-width header row: title left, add button right */}
      <div className="col-span-12 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Watchlist</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor prices and trade directly from this list. Add a market above, then use the Buy button to place an order.
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
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30">
              <div className="w-52 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wider">Markets</div>
              <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wider">Change 1D</div>
              <div className="w-52 shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wider">1Y Chart</div>
              <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground text-center uppercase tracking-wider">Buy</div>
              <div className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">52W Range</div>
              <div className="w-24 shrink-0 text-right">
                {lastUpdated && (
                  <span className="text-[10px] text-muted-foreground">Updated {lastUpdated}</span>
                )}
              </div>
            </div>
            {items.map((item) => (
              <WatchlistRow
                key={item.symbol}
                symbol={item.symbol}
                companyName={item.company_name}
                priceData={prices[item.symbol]}
                priceLoading={priceLoading && !prices[item.symbol]}
                simulationDate={simulationDate}
              />
            ))}
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
