'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { CashDonut } from '@/components/wallet/cash-donut'
import { PlusCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'

interface WalletSummary {
  cash: number
  invested: number
  pnl: number
  total: number
  updatedAt: string | null
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatTimestamp(ts: string | null) {
  if (!ts) return null
  return `Last update at ${fmtDateTime(ts)}`
}

export function WalletClient({ summary }: { summary: WalletSummary }) {
  const [depositOpen, setDepositOpen] = useState(false)

  const investedPct = summary.total > 0 ? (summary.invested / summary.total) * 100 : 0
  const pnlPositive = summary.pnl >= 0

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Full-width header */}
      <div className="col-span-12">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your virtual trading balance. Deposit funds, track available cash, and monitor overall account value.
        </p>
      </div>

      {/* Hero balance card */}
      <div className="col-span-12">
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              {/* Total value + deposit */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Your Total Value</p>
                  <p className="text-4xl font-bold mt-1">{fmt(summary.total)}</p>
                  {formatTimestamp(summary.updatedAt) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(summary.updatedAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">USD</Badge>
                  <Button
                    className="rounded-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setDepositOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Deposit
                  </Button>
                </div>
              </div>

              {/* Donut chart */}
              {summary.total > 0 && (
                <CashDonut cash={summary.cash} invested={summary.invested} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary stats row */}
      <div className="col-span-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Available</p>
              <p className="text-2xl font-bold mt-1">{fmt(summary.cash)}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready to invest</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Invested</p>
              <p className="text-2xl font-bold mt-1">{fmt(summary.invested)}</p>
              <p className="text-xs text-muted-foreground mt-1">Open positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Profit / Loss</p>
              <p className={`text-2xl font-bold mt-1 flex items-center gap-1 ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
                {pnlPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {fmt(summary.pnl)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Unrealised</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Equity</p>
              <p className="text-2xl font-bold mt-1">{fmt(summary.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">Cash + Invested + P/L</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account detail */}
      <div className="col-span-12">
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  $
                </div>
                <div>
                  <p className="font-medium">Investment Account</p>
                  <p className="text-xs text-muted-foreground">Virtual trading balance</p>
                </div>
              </div>
              <p className="font-semibold">{fmt(summary.total)}</p>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-muted-foreground">Available USD</span>
              <span className="font-medium">{fmt(summary.cash)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
    </div>
  )
}
