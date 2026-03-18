'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { addToWatchlist } from '@/lib/actions/watchlist'
import { Plus, Loader2 } from 'lucide-react'

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
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSearch(q: string) {
    if (q.length < 1) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const all: SearchResult[] = data?.data ?? []
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
      <DialogContent className="p-0 sm:max-w-md overflow-hidden">
        <DialogTitle className="sr-only">Search stocks</DialogTitle>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search symbol or company…"
            onValueChange={handleSearch}
          />
          <CommandList className="max-h-72">
            {searching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!searching && (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                {results.length > 0 && (
                  <CommandGroup heading="Results">
                    {results.map((r) => (
                      <CommandItem
                        key={`${r.symbol}-${r.exchange}`}
                        value={r.symbol}
                        onSelect={() => handleAdd(r.symbol, r.instrument_name)}
                        className="flex items-center justify-between cursor-pointer"
                        disabled={adding === r.symbol || isPending}
                      >
                        <div>
                          <span className="font-medium text-sm">{r.symbol}</span>
                          <span className="text-xs text-muted-foreground ml-2">{r.instrument_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">· {r.exchange}</span>
                        </div>
                        <span className="ml-2 shrink-0">
                          {adding === r.symbol
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Plus className="h-4 w-4 text-muted-foreground" />}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
