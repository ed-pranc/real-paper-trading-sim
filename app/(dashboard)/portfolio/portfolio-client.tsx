'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortfolioRow } from '@/components/portfolio/portfolio-row'
import { PortfolioChart } from '@/components/portfolio/portfolio-chart'
import { CompositionDonut } from '@/components/portfolio/composition-donut'
import { useSimulationDate } from '@/context/simulation-date'
import { useWallet } from '@/context/wallet'
import { BarChart2 } from 'lucide-react'
import { LABELS } from '@/lib/labels'

interface Position {
  symbol: string
  company_name: string
  quantity: number
  avg_buy_price: number
  opened_at: string
}

interface Snapshot {
  snapshot_date: string
  total_value: number
  cash: number
  invested: number
}

interface Transaction {
  symbol: string
  company_name: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  simulation_date: string | null
  trade_date: string
}

interface EffectivePosition {
  symbol: string
  company_name: string
  quantity: number
  avg_buy_price: number
  opened_date: string
  is_future: boolean
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/** Returns the "effective date" of a transaction for ordering/filtering purposes. */
function effectiveDate(tx: Transaction): string {
  return tx.simulation_date ?? tx.trade_date.slice(0, 10)
}

/**
 * Replays all transactions to compute effective positions.
 * - In sim mode (simDate set): replays only transactions with effectiveDate ≤ simDate.
 *   Symbols whose first buy is after simDate are marked is_future = true (shown greyed).
 * - In live mode: passes through positions as-is, enriched with opened_date from transactions.
 */
function computeEffectivePositions(
  transactions: Transaction[],
  positions: Position[],
  simDate: string | null
): EffectivePosition[] {
  // Sort all transactions by effective date ascending
  const sorted = [...transactions].sort((a, b) =>
    effectiveDate(a).localeCompare(effectiveDate(b))
  )

  // Build a map of symbol → first buy effective date (across ALL transactions)
  const firstBuyDate: Record<string, string> = {}
  for (const tx of sorted) {
    if (tx.type === 'buy' && !(tx.symbol in firstBuyDate)) {
      firstBuyDate[tx.symbol] = effectiveDate(tx)
    }
  }

  const result: EffectivePosition[] = []

  for (const pos of positions) {
    const symbol = pos.symbol
    const firstDate = firstBuyDate[symbol]

    if (!simDate) {
      // Live mode: use DB position as-is, enrich with opened_date
      result.push({
        symbol,
        company_name: pos.company_name,
        quantity: Number(pos.quantity),
        avg_buy_price: Number(pos.avg_buy_price),
        opened_date: firstDate ?? pos.opened_at.slice(0, 10),
        is_future: false,
      })
      continue
    }

    // Sim mode
    if (!firstDate || firstDate > simDate) {
      // All buys are in the future relative to sim date → grey out with full current values
      result.push({
        symbol,
        company_name: pos.company_name,
        quantity: Number(pos.quantity),
        avg_buy_price: Number(pos.avg_buy_price),
        opened_date: firstDate ?? pos.opened_at.slice(0, 10),
        is_future: true,
      })
      continue
    }

    // Replay transactions for this symbol up to and including simDate
    const symbolTxs = sorted.filter(tx => tx.symbol === symbol && effectiveDate(tx) <= simDate)
    let qty = 0
    let totalCost = 0
    let openedDate = firstDate

    for (const tx of symbolTxs) {
      if (tx.type === 'buy') {
        totalCost += Number(tx.quantity) * Number(tx.price)
        qty += Number(tx.quantity)
      } else {
        // sell: qty decreases, avg price unchanged, cost basis adjusts proportionally
        const avgPrice = qty > 0 ? totalCost / qty : 0
        qty -= Number(tx.quantity)
        totalCost -= Number(tx.quantity) * avgPrice
        if (qty < 0) qty = 0
        if (totalCost < 0) totalCost = 0
      }
    }

    if (qty <= 0.000001) continue // position was fully closed as of sim date

    result.push({
      symbol,
      company_name: pos.company_name,
      quantity: qty,
      avg_buy_price: qty > 0 ? totalCost / qty : 0,
      opened_date: openedDate,
      is_future: false,
    })
  }

  return result
}

export function PortfolioClient({
  positions,
  snapshots,
  transactions,
}: {
  positions: Position[]
  snapshots: Snapshot[]
  transactions: Transaction[]
}) {
  const { simulationDate } = useSimulationDate()
  const { summary } = useWallet()

  // Price map lifted from PortfolioRow for sim-mode summary calculation
  const [priceMap, setPriceMap] = useState<Record<string, number>>({})
  const handlePriceLoaded = useCallback((symbol: string, price: number) => {
    setPriceMap(prev => prev[symbol] === price ? prev : { ...prev, [symbol]: price })
  }, [])

  const effectivePositions = computeEffectivePositions(transactions, positions, simulationDate)
  const activePositions = effectivePositions.filter(p => !p.is_future)
  const futurePositions = effectivePositions.filter(p => p.is_future)

  // Summary cards: in sim mode compute from effectivePositions + priceMap
  let displaySummary: { invested: number; pnl: number | null; total: number | null }
  if (simulationDate) {
    const invested = activePositions.reduce((s, p) => s + p.quantity * p.avg_buy_price, 0)
    // Only show Total Value when every active position has a real current price loaded
    const allPricesLoaded = activePositions.length > 0 &&
      activePositions.every(p => (priceMap[p.symbol] ?? 0) > 0)
    const total = allPricesLoaded
      ? activePositions.reduce((s, p) => s + priceMap[p.symbol]! * p.quantity, 0)
      : null
    displaySummary = { invested, total, pnl: total !== null ? total - invested : null }
  } else {
    displaySummary = { ...summary, pnl: summary.pnl, total: summary.total }
  }

  // Filter snapshots to ≤ simulationDate in sim mode
  const filteredSnapshots = simulationDate
    ? snapshots.filter(s => s.snapshot_date <= simulationDate)
    : snapshots

  // Chart symbols: only active positions
  const chartSymbols = activePositions.map(p => ({
    symbol: p.symbol,
    quantity: p.quantity,
  }))

  const hasAnyPositions = positions.length > 0

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Full-width header */}
      <div className="col-span-12">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your open positions and performance. Buy more or close positions at live or historical prices.
        </p>
      </div>

      {hasAnyPositions ? (
        <>
          {/* Summary stats (col-8) + Composition donut (col-4) */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-4 content-start">
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{LABELS.invested}</p>
                <p className="text-2xl font-bold mt-1">{fmt(displaySummary.invested)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{LABELS.unrealisedPnl}</p>
                <p className={`text-2xl font-bold mt-1 ${(displaySummary.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {displaySummary.pnl !== null
                    ? `${displaySummary.pnl >= 0 ? '+' : ''}${fmt(displaySummary.pnl)}`
                    : '—'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{LABELS.totalValue}</p>
                <p className="text-2xl font-bold mt-1">
                  {displaySummary.total !== null ? fmt(displaySummary.total) : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <Card className="h-full">
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-sm">Composition</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pb-4">
                <CompositionDonut
                  positions={activePositions.map(p => ({
                    symbol: p.symbol,
                    quantity: p.quantity,
                    avgBuyPrice: p.avg_buy_price,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          {/* Portfolio chart — full width */}
          <div className="col-span-12">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Portfolio Value Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <PortfolioChart
                  symbols={chartSymbols}
                  simulationDate={simulationDate}
                />
              </CardContent>
            </Card>
          </div>

          {/* Positions table — full width */}
          <div className="col-span-12">
            <Card>
              <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30 rounded-t-lg">
                <div className="w-48 shrink-0 text-xs font-medium text-muted-foreground">Asset</div>
                <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground">Current Price</div>
                <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Units</div>
                <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Buy Price</div>
                <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground">Trade Date</div>
                <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground">P/L</div>
                <div className="flex-1 text-xs font-medium text-muted-foreground">Value</div>
                <div className="w-36 shrink-0"></div>
              </div>
              {/* Active (current as-of-sim-date) positions first */}
              {activePositions.map((p) => (
                <PortfolioRow
                  key={p.symbol}
                  symbol={p.symbol}
                  companyName={p.company_name}
                  quantity={p.quantity}
                  avgBuyPrice={p.avg_buy_price}
                  openedDate={p.opened_date}
                  isFuture={false}
                  onPriceLoaded={handlePriceLoaded}
                />
              ))}
              {/* Future (greyed) positions */}
              {futurePositions.map((p) => (
                <PortfolioRow
                  key={p.symbol}
                  symbol={p.symbol}
                  companyName={p.company_name}
                  quantity={p.quantity}
                  avgBuyPrice={p.avg_buy_price}
                  openedDate={p.opened_date}
                  isFuture={true}
                  onPriceLoaded={handlePriceLoaded}
                />
              ))}
            </Card>
          </div>
        </>
      ) : (
        <div className="col-span-12 flex flex-col items-center justify-center py-24 text-center">
          <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No open positions</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Buy stocks from the Watchlist or Trade page to see them here
          </p>
        </div>
      )}
    </div>
  )
}
