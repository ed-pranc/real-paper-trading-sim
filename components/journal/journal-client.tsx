'use client'

import { useState, useTransition, useMemo } from 'react'
import { fmtDate, fmtDateTime } from '@/lib/utils'
import { useSimulationDate } from '@/context/simulation-date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { BookOpen, Pencil, Trash2 } from 'lucide-react'
import { updateTransactionNotes } from '@/lib/actions/trade'
import { toast } from 'sonner'

interface JournalEntry {
  id: string
  symbol: string
  company_name: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  total: number
  pnl: number | null
  trade_date: string
  simulation_date: string | null
  notes: string
}

interface JournalClientProps {
  entries: JournalEntry[]
}

function fmt2(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function JournalClient({ entries: initialEntries }: JournalClientProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [symbolSearch, setSymbolSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isPending, startTransition] = useTransition()
  const { simulationDate } = useSimulationDate()

  // SIM entry is inactive when the user has rewound to before the trade's sim date
  function isEntryInactive(entry: JournalEntry): boolean {
    return (
      simulationDate !== null &&
      entry.simulation_date !== null &&
      entry.simulation_date > simulationDate
    )
  }

  const filtered = useMemo(() =>
    entries
      .filter(e => typeFilter === 'all' || e.type === typeFilter)
      .filter(e => !symbolSearch || e.symbol.toLowerCase().includes(symbolSearch.toLowerCase())),
    [entries, typeFilter, symbolSearch]
  )

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id)
    setEditText(entry.notes)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  function saveEdit(id: string) {
    startTransition(async () => {
      try {
        await updateTransactionNotes(id, editText)
        setEntries(prev => prev.map(e => e.id === id ? { ...e, notes: editText.trim() } : e))
        setEditingId(null)
        setEditText('')
      } catch {
        toast.error('Could not save note')
      }
    })
  }

  function deleteNote(id: string) {
    startTransition(async () => {
      try {
        await updateTransactionNotes(id, '')
        setEntries(prev => prev.filter(e => e.id !== id))
      } catch {
        toast.error('Could not delete note')
      }
    })
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your annotated trades — a record of your reasoning, trade by trade.
          </p>
        </div>
        <div className="col-span-12 flex flex-col items-center justify-center py-24 gap-3 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-base font-medium">Your journal is empty</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Add a note when placing a trade to start tracking your reasoning.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Header */}
      <div className="col-span-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Journal</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your annotated trades — a record of your reasoning, trade by trade.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 mt-1">
            {entries.length} annotated trade{entries.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="col-span-12 flex flex-wrap items-center gap-2">
        {(['all', 'buy', 'sell'] as const).map(t => (
          <Button
            key={t}
            variant={typeFilter === t ? 'default' : 'outline'}
            size="sm"
            className="rounded-full h-8 px-3 text-xs capitalize"
            onClick={() => setTypeFilter(t)}
          >
            {t}
          </Button>
        ))}

        <Input
          placeholder="Filter by symbol…"
          value={symbolSearch}
          onChange={e => setSymbolSearch(e.target.value)}
          className="h-8 w-40 text-xs"
        />

        {(typeFilter !== 'all' || symbolSearch) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setTypeFilter('all'); setSymbolSearch('') }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="col-span-12">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm text-muted-foreground">No entries match the current filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => { setTypeFilter('all'); setSymbolSearch('') }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Mobile: left-aligned vertical line */}
            <div className="md:hidden absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
            {/* Desktop: centered vertical line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6 pb-2">
              {filtered.map((entry) => {
                const isBuy = entry.type === 'buy'
                const hasPnl = !isBuy && entry.pnl != null
                const pnlPositive = hasPnl && entry.pnl! >= 0
                const isEditing = editingId === entry.id
                const inactive = isEntryInactive(entry)

                // Date label: SIM entries show the simulation date only; LIVE entries show date+time
                const dateLabel = entry.simulation_date
                  ? fmtDate(entry.simulation_date)
                  : fmtDateTime(entry.trade_date)

                // Card shared by mobile and desktop
                const card = (
                  <div className={`w-full rounded-lg border bg-card p-4 space-y-3 transition-opacity ${inactive ? 'opacity-40' : ''}`}>
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {entry.simulation_date
                          ? <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{fmtDate(entry.simulation_date)}</Badge>
                          : <span>{dateLabel}</span>
                        }
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 px-1.5 ${
                            isBuy
                              ? 'text-green-600 border-green-600/40'
                              : 'text-red-500 border-red-500/40'
                          }`}
                        >
                          {isBuy ? 'BUY' : 'SELL'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => isEditing ? cancelEdit() : startEdit(entry)}
                          disabled={isPending || inactive}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              disabled={isPending || inactive}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete note?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the note from this trade. The trade itself will not be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteNote(entry.id)}
                              >
                                Delete note
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Trade summary */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {Number(entry.quantity).toFixed(4)}×{' '}
                        <span className="font-semibold">{entry.symbol}</span>
                        <span className="text-muted-foreground font-normal"> @ ${fmt2(Number(entry.price))}</span>
                        <span className="text-muted-foreground font-normal"> · ${fmt2(Number(entry.total))}</span>
                      </p>
                      {hasPnl && (
                        <span className={`text-sm font-semibold ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {pnlPositive ? '+' : ''}${fmt2(entry.pnl!)}
                        </span>
                      )}
                    </div>

                    {/* Note — read or edit */}
                    <div className="border-t pt-3">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            maxLength={500}
                            rows={3}
                            className="resize-none text-sm"
                            autoFocus
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{editText.length}/500</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit} disabled={isPending}>
                                Cancel
                              </Button>
                              <Button size="sm" className="h-7 text-xs" onClick={() => saveEdit(entry.id)} disabled={isPending}>
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )

                return (
                  <div key={entry.id} className={`relative ${inactive ? 'pointer-events-none select-none' : ''}`}>

                    {/* ── MOBILE: classic left-aligned timeline ── */}
                    <div className="md:hidden relative pl-9">
                      <span className={`absolute left-0 top-3 z-10 w-4 h-4 rounded-full border-2 border-background ${isBuy ? 'bg-green-500' : 'bg-red-500'}`} />
                      {card}
                    </div>

                    {/* ── DESKTOP: centered timeline, buys left / sells right ── */}
                    <div className="hidden md:flex items-start">
                      {/* Left half — BUY cards */}
                      <div className="w-1/2 pr-10 flex justify-end">
                        {isBuy ? card : null}
                      </div>

                      {/* Center dot */}
                      <span className={`absolute left-1/2 -translate-x-1/2 top-3 z-10 w-4 h-4 rounded-full border-2 border-background ${isBuy ? 'bg-green-500' : 'bg-red-500'}`} />

                      {/* Right half — SELL cards */}
                      <div className="w-1/2 pl-10">
                        {!isBuy ? card : null}
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
