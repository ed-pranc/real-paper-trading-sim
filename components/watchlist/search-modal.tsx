'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { addToWatchlist } from '@/lib/actions/watchlist'
import { Search, Plus, Loader2 } from 'lucide-react'

interface SearchResult {
  symbol: string
  instrument_name: string
  exchange: string
  type: string
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.length < 1) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const all: SearchResult[] = data?.data ?? []
      // Deduplicate by symbol, prefer NYSE/NASDAQ
      const seen = new Set<string>()
      const deduped = all
        .sort((a, b) => {
          const preferred = ['NASDAQ', 'NYSE', 'NYSE Arca']
          return preferred.includes(b.exchange) ? 1 : preferred.includes(a.exchange) ? -1 : 0
        })
        .filter(r => {
          if (seen.has(r.symbol)) return false
          seen.add(r.symbol)
          return true
        })
        .slice(0, 8)
      setResults(deduped)
    } finally {
      setSearching(false)
    }
  }

  function handleAdd(symbol: string, name: string) {
    setAdding(symbol)
    startTransition(async () => {
      await addToWatchlist(symbol, name)
      setAdding(null)
      onClose()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbol or company..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="space-y-1 max-h-72 overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!searching && results.map((r) => (
            <div
              key={`${r.symbol}-${r.exchange}`}
              className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent"
            >
              <div>
                <span className="font-medium text-sm">{r.symbol}</span>
                <span className="text-xs text-muted-foreground ml-2">{r.instrument_name}</span>
                <span className="text-xs text-muted-foreground ml-2">· {r.exchange}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-full"
                disabled={adding === r.symbol || isPending}
                onClick={() => handleAdd(r.symbol, r.instrument_name)}
              >
                {adding === r.symbol
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          ))}
          {!searching && query.length > 0 && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
