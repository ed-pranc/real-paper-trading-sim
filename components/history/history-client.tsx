'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PnLChart } from '@/components/history/pnl-chart'
import { TradesInvestedChart } from '@/components/history/trades-invested-chart'
import { TradesPerYearChart } from '@/components/history/trades-per-year-chart'
import { WinRateRing } from '@/components/history/win-rate-ring'
import { ArrowDownCircle, ArrowUpCircle, History, ArrowUpDown } from 'lucide-react'
import { StockDetailSheet } from '@/components/stock/stock-detail-sheet'
import { fmtDate, fmtDateTime } from '@/lib/utils'
import { LABELS } from '@/lib/labels'
import { useSimulationDate } from '@/context/simulation-date'

interface Transaction {
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
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

type SortKey = 'trade_date' | 'symbol' | 'total' | 'pnl'
type SortDir = 'asc' | 'desc'

function SortBtn({ k, label, onToggle, className }: { k: SortKey; label: string; onToggle: (key: SortKey) => void; className?: string }) {
  return (
    <button
      onClick={() => onToggle(k)}
      className={`flex items-center gap-1 hover:opacity-70 transition-opacity ${className ?? ''}`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )
}

export function HistoryClient({ transactions }: { transactions: Transaction[] }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('trade_date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const { simulationDate } = useSimulationDate()

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  // In sim mode, stats only count transactions up to the current sim date.
  const statsTransactions = useMemo(() => {
    if (!simulationDate) return transactions
    return transactions.filter(t => {
      const effDate = t.simulation_date ?? t.trade_date.slice(0, 10)
      return effDate <= simulationDate
    })
  }, [transactions, simulationDate])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // In sim mode, filter by simulation_date; in live mode by trade_date
      const date = simulationDate
        ? (t.simulation_date ?? t.trade_date.slice(0, 10))
        : t.trade_date.slice(0, 10)
      if (from && date < from) return false
      if (to && date > to) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      return true
    }).sort((a, b) => {
      let cmp = 0
      if (sortKey === 'trade_date') cmp = a.trade_date.localeCompare(b.trade_date)
      else if (sortKey === 'symbol') cmp = a.symbol.localeCompare(b.symbol)
      else if (sortKey === 'total') cmp = a.total - b.total
      else if (sortKey === 'pnl') cmp = (a.pnl ?? 0) - (b.pnl ?? 0)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [transactions, from, to, sortKey, sortDir, typeFilter, simulationDate])

  const totalIn = statsTransactions.filter(t => t.type === 'buy').reduce((s, t) => s + t.total, 0)
  const totalOut = statsTransactions.filter(t => t.type === 'sell').reduce((s, t) => s + t.total, 0)
  const realisedPnL = statsTransactions.filter(t => t.type === 'sell' && t.pnl != null).reduce((s, t) => s + Number(t.pnl ?? 0), 0)

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Full-width header */}
      <div className="col-span-12">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Full record of all your trades. Filter by date range and type. Realised P/L tracks closed positions.
        </p>
        {simulationDate && (
          <p className="text-xs text-amber-500 mt-1">
            Stats showing trades up to sim date {fmtDate(simulationDate)}
          </p>
        )}
      </div>

      {/* Stats (col-9) + Win Rate ring (col-3) */}
      <div className="col-span-12 lg:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-4 content-start">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Trades</p>
            <p className="text-2xl font-bold mt-1">{statsTransactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Opened Trades</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalIn)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Closed Trades</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalOut)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{LABELS.realisedPnl}</p>
            <p className={`text-2xl font-bold mt-1 ${realisedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {realisedPnL >= 0 ? '+' : ''}{fmt(realisedPnL)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-3">
        <Card className="h-full min-h-[120px]">
          <CardContent className="pt-4 h-full">
            <WinRateRing transactions={statsTransactions} />
          </CardContent>
        </Card>
      </div>

      {/* Charts — side by side */}
      <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Invested Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <TradesInvestedChart transactions={statsTransactions} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cumulative Realised P/L</CardTitle>
          </CardHeader>
          <CardContent>
            <PnLChart transactions={statsTransactions} />
          </CardContent>
        </Card>
      </div>

      {/* Trades per Year — full width */}
      <div className="col-span-12">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trades per Year</CardTitle>
          </CardHeader>
          <CardContent>
            <TradesPerYearChart transactions={statsTransactions} />
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <div className="col-span-12">
        <h2 className="text-base font-semibold mb-3">Transactions</h2>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No transactions yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Buy or sell stocks from the Watchlist page to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">From</span>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-8 w-36 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">To</span>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-8 w-36 text-xs" />
              </div>
              <div className="flex gap-1">
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
              </div>
              {(from || to || typeFilter !== 'all') && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFrom(''); setTo(''); setTypeFilter('all') }}>
                  Clear
                </Button>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {filtered.length} of {transactions.length} transactions
              </span>
            </div>

            <Card>
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No transactions match the current filters
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead><SortBtn k="symbol" label="Asset" onToggle={toggleSort} /></TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">
                        <SortBtn k="total" label="Total" onToggle={toggleSort} className="justify-end w-full" />
                      </TableHead>
                      <TableHead className="text-right">
                        <SortBtn k="pnl" label="P/L" onToggle={toggleSort} className="justify-end w-full" />
                      </TableHead>
                      <TableHead>
                        <SortBtn k="trade_date" label="Trade Date" onToggle={toggleSort} />
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">Sim Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(t => {
                      const pnlPositive = (t.pnl ?? 0) >= 0
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            {t.type === 'buy'
                              ? <ArrowDownCircle className="h-5 w-5 text-green-500" />
                              : <ArrowUpCircle className="h-5 w-5 text-red-500" />}
                          </TableCell>
                          <TableCell>
                            <StockDetailSheet symbol={t.symbol} companyName={t.company_name} simulationDate={t.simulation_date}>
                              <div className="cursor-pointer hover:opacity-80 transition-opacity">
                                <p className="font-semibold text-sm">{t.symbol}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-28">{t.company_name}</p>
                              </div>
                            </StockDetailSheet>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs rounded-full ${t.type === 'buy' ? 'bg-green-600/20 text-green-500 border-green-600/30' : 'bg-red-600/20 text-red-500 border-red-600/30'}`} variant="outline">
                              {t.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm tabular-nums">{Number(t.quantity).toFixed(6)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm tabular-nums">{fmt(t.price)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-medium tabular-nums">{fmt(t.total)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {t.type === 'sell' && t.pnl != null ? (
                              <span className={`text-sm font-semibold tabular-nums ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {pnlPositive ? '+' : ''}{fmt(Number(t.pnl))}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">{fmtDateTime(t.trade_date)}</span>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {t.simulation_date ? (
                              <Badge variant="secondary" className="text-xs">{fmtDate(t.simulation_date)}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Live</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        )}
      </div>

    </div>
  )
}
