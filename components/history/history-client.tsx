'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PnLChart } from '@/components/history/pnl-chart'
import { MonthlyReturns } from '@/components/history/monthly-returns'
import { WinRateRing } from '@/components/history/win-rate-ring'
import { ArrowDownCircle, ArrowUpCircle, History, ArrowUpDown } from 'lucide-react'

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

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

type SortKey = 'trade_date' | 'symbol' | 'total' | 'pnl'
type SortDir = 'asc' | 'desc'

function SortBtn({ k, label, onToggle }: { k: SortKey; label: string; onToggle: (key: SortKey) => void }) {
  return (
    <button
      onClick={() => onToggle(k)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const date = t.trade_date.slice(0, 10)
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
  }, [transactions, from, to, sortKey, sortDir, typeFilter])

  const totalIn = transactions.filter(t => t.type === 'buy').reduce((s, t) => s + t.total, 0)
  const totalOut = transactions.filter(t => t.type === 'sell').reduce((s, t) => s + t.total, 0)
  const realisedPnL = transactions.filter(t => t.type === 'sell' && t.pnl != null).reduce((s, t) => s + Number(t.pnl ?? 0), 0)

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Full-width header */}
      <div className="col-span-12">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Full record of all your trades. Filter by date range and type. Realised P/L tracks closed positions.
        </p>
      </div>

      {/* Stats (col-9) + Win Rate ring (col-3) */}
      <div className="col-span-12 lg:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-4 content-start">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Trades</p>
            <p className="text-2xl font-bold mt-1">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Money In</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalIn)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Money Out</p>
            <p className="text-2xl font-bold mt-1">{fmt(totalOut)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Realised P/L</p>
            <p className={`text-2xl font-bold mt-1 ${realisedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {realisedPnL >= 0 ? '+' : ''}{fmt(realisedPnL)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-3">
        <Card className="h-full min-h-[120px]">
          <CardContent className="pt-4 h-full">
            <WinRateRing transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      {/* Charts: Cumulative P/L (col-7) + Monthly Returns (col-5) */}
      <div className="col-span-12 lg:col-span-7">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cumulative Realised P/L</CardTitle>
          </CardHeader>
          <CardContent>
            <PnLChart transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyReturns transactions={transactions} />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="col-span-12">
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
      </div>

      {/* Transaction table */}
      <div className="col-span-12">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No transactions yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Buy or sell stocks from the Trade or Watchlist page to see them here
            </p>
          </div>
        ) : (
          <Card>
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/30 rounded-t-lg">
              <div className="w-8 shrink-0"></div>
              <div className="w-32 shrink-0"><SortBtn k="symbol" label="Asset" onToggle={toggleSort} /></div>
              <div className="w-20 shrink-0 text-xs font-medium text-muted-foreground">Type</div>
              <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground text-right">Qty</div>
              <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground text-right">Price</div>
              <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground text-right">
                <SortBtn k="total" label="Total" onToggle={toggleSort} />
              </div>
              <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground text-right">
                <SortBtn k="pnl" label="P/L" onToggle={toggleSort} />
              </div>
              <div className="flex-1 text-xs font-medium text-muted-foreground">
                <SortBtn k="trade_date" label="Trade Date" onToggle={toggleSort} />
              </div>
              <div className="hidden xl:block w-28 text-xs font-medium text-muted-foreground">Sim Date</div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No transactions match the current filters
              </div>
            ) : (
              filtered.map(t => {
                const pnlPositive = (t.pnl ?? 0) >= 0
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors last:border-0">
                    <div className="w-8 shrink-0">
                      {t.type === 'buy' ? <ArrowDownCircle className="h-5 w-5 text-green-500" /> : <ArrowUpCircle className="h-5 w-5 text-red-500" />}
                    </div>
                    <div className="w-32 shrink-0">
                      <p className="font-semibold text-sm">{t.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-28">{t.company_name}</p>
                    </div>
                    <div className="w-20 shrink-0">
                      <Badge className={`text-xs rounded-full ${t.type === 'buy' ? 'bg-green-600/20 text-green-500 border-green-600/30' : 'bg-red-600/20 text-red-500 border-red-600/30'}`} variant="outline">
                        {t.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <p className="text-sm tabular-nums">{Number(t.quantity).toFixed(6)}</p>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <p className="text-sm tabular-nums">{fmt(t.price)}</p>
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums">{fmt(t.total)}</p>
                    </div>
                    <div className="w-28 shrink-0 text-right">
                      {t.type === 'sell' && t.pnl != null ? (
                        <p className={`text-sm font-semibold tabular-nums ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {pnlPositive ? '+' : ''}{fmt(Number(t.pnl))}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">—</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{fmtDate(t.trade_date)}</p>
                    </div>
                    <div className="hidden xl:block w-28">
                      {t.simulation_date ? (
                        <Badge variant="secondary" className="text-xs">{t.simulation_date.slice(0, 10)}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Live</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
