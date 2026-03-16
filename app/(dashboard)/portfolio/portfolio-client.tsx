'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PortfolioRow } from '@/components/portfolio/portfolio-row'
import { PortfolioChart } from '@/components/portfolio/portfolio-chart'
import { useSimulationDate } from '@/context/simulation-date'
import { useWallet } from '@/context/wallet'
import { BarChart2 } from 'lucide-react'

interface Position {
  symbol: string
  company_name: string
  quantity: number
  avg_buy_price: number
  opened_at: string
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function PortfolioClient({ positions }: { positions: Position[] }) {
  const { simulationDate } = useSimulationDate()
  const { summary } = useWallet()

  const chartSymbols = positions.map(p => ({
    symbol: p.symbol,
    quantity: Number(p.quantity),
  }))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your open positions and performance. Buy more or close positions at live or historical prices.
        </p>
      </div>

      {/* Portfolio value over time chart */}
      {positions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Portfolio Value Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioChart symbols={chartSymbols} simulationDate={simulationDate} />
          </CardContent>
        </Card>
      )}

      {/* Summary row */}
      {positions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Invested</p>
              <p className="text-xl font-semibold mt-1">{fmt(summary.invested)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Unrealised P/L</p>
              <p className={`text-xl font-semibold mt-1 ${summary.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {summary.pnl >= 0 ? '+' : ''}{fmt(summary.pnl)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-xl font-semibold mt-1">{fmt(summary.total)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Positions table */}
      {positions.length > 0 ? (
        <Card>
          <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-muted/30 rounded-t-lg">
            <div className="w-48 shrink-0 text-xs font-medium text-muted-foreground">Asset</div>
            <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground">Price</div>
            <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Units</div>
            <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground">Avg. Open</div>
            <div className="w-28 shrink-0 text-xs font-medium text-muted-foreground">P/L</div>
            <div className="flex-1 text-xs font-medium text-muted-foreground">Value</div>
            <div className="w-36 shrink-0"></div>
          </div>
          {positions.map((p) => (
            <PortfolioRow
              key={p.symbol}
              symbol={p.symbol}
              companyName={p.company_name}
              quantity={Number(p.quantity)}
              avgBuyPrice={Number(p.avg_buy_price)}
            />
          ))}
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
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
