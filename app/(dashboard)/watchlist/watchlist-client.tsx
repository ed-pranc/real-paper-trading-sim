'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SearchModal } from '@/components/watchlist/search-modal'
import { WatchlistRow } from '@/components/watchlist/watchlist-row'
import { Plus, Eye } from 'lucide-react'

interface WatchlistItem {
  symbol: string
  company_name: string
  added_at: string
}

export function WatchlistClient({ items }: { items: WatchlistItem[] }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Watchlist</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor stocks with real-time prices. Select a simulation date in the header to view historical data.
          </p>
        </div>
        <Button
          onClick={() => setSearchOpen(true)}
          className="rounded-full bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Markets
        </Button>
      </div>

      {/* Table header */}
      {items.length > 0 && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30">
            <div className="w-48 shrink-0 text-xs font-medium text-muted-foreground">Markets</div>
            <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Change 1D</div>
            <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground"></div>
            <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground text-center">Sell</div>
            <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground text-center">Buy</div>
            <div className="flex-1 text-xs font-medium text-muted-foreground">52W Range</div>
            <div className="hidden xl:block w-28 shrink-0 text-xs font-medium text-muted-foreground text-right">Updated</div>
            <div className="w-24 shrink-0"></div>
          </div>

          {items.map((item) => (
            <WatchlistRow
              key={item.symbol}
              symbol={item.symbol}
              companyName={item.company_name}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
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

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
