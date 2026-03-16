'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { PlusCircle, TrendingUp, TrendingDown } from 'lucide-react'

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
  const d = new Date(ts)
  return `Last update at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}, ${d.toLocaleDateString('en-GB')}`
}

export function WalletClient({ summary }: { summary: WalletSummary }) {
  const [depositOpen, setDepositOpen] = useState(false)

  const investedPct = summary.total > 0 ? (summary.invested / summary.total) * 100 : 0
  const pnlPositive = summary.pnl >= 0

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left: header + hero card */}
      <div className="col-span-12 lg:col-span-3 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your virtual funds. Deposit money to start trading stocks at real market prices.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold mt-1">{fmt(summary.total)}</p>
                {formatTimestamp(summary.updatedAt) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(summary.updatedAt)}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-xs">USD</Badge>
            </div>

            <div className="space-y-1">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(investedPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {investedPct.toFixed(0)}% Invested
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-full w-full"
              onClick={() => setDepositOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Deposit Virtual Funds
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: summary cards + account detail */}
      <div className="col-span-12 lg:col-span-9 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Available Funds</p>
              <p className="text-xl font-semibold mt-1">{fmt(summary.cash)}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready to invest</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Invested</p>
              <p className="text-xl font-semibold mt-1">{fmt(summary.invested)}</p>
              <p className="text-xs text-muted-foreground mt-1">Open positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Profit / Loss</p>
              <p className={`text-xl font-semibold mt-1 flex items-center gap-1 ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
                {pnlPositive
                  ? <TrendingUp className="h-4 w-4" />
                  : <TrendingDown className="h-4 w-4" />}
                {fmt(summary.pnl)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Unrealised</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-xl font-semibold mt-1">{fmt(summary.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">Available + Invested + P/L</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
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
