'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { WithdrawModal } from '@/components/wallet/withdraw-modal'
import { CashDonut } from '@/components/wallet/cash-donut'
import { PlusCircle, MinusCircle, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { fmtDateTime } from '@/lib/utils'
import { LABELS } from '@/lib/labels'

interface WalletSummary {
  cash: number
  invested: number
  pnl: number
  total: number
  updatedAt: string | null
}

interface DepositRow {
  id: string
  type: string
  amount: number
  created_at: string
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatTimestamp(ts: string | null) {
  if (!ts) return null
  return `Last update at ${fmtDateTime(ts)}`
}

export function WalletClient({
  summary,
  depositHistory,
}: {
  summary: WalletSummary
  depositHistory: DepositRow[]
}) {
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  const pnlPositive = summary.pnl >= 0

  // Compute running balance from oldest → newest, then reverse for display
  const chronological = [...depositHistory].reverse()
  let running = 0
  const rowsWithBalance = chronological.map((row) => {
    running += row.type === 'deposit' ? row.amount : -row.amount
    return { ...row, runningBalance: running }
  })
  const displayRows = rowsWithBalance.reverse()

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
              {/* Total value + actions */}
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
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setWithdrawOpen(true)}
                  >
                    <MinusCircle className="h-4 w-4 mr-2" />
                    Withdraw
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
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{LABELS.cash}</p>
              <p className="text-2xl font-bold mt-1">{fmt(summary.cash)}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready to invest</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{LABELS.invested}</p>
              <p className="text-2xl font-bold mt-1">{fmt(summary.invested)}</p>
              <p className="text-xs text-muted-foreground mt-1">Open positions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{LABELS.unrealisedPnl}</p>
              <p className={`text-2xl font-bold mt-1 flex items-center gap-1 ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
                {pnlPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {fmt(summary.pnl)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{LABELS.totalValue}</p>
              <p className="text-2xl font-bold mt-1">{fmt(summary.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">Cash + Invested + Unrealised P/L</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Investment Account ledger */}
      <div className="col-span-12">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Investment Account</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {displayRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No transactions yet. Deposit funds to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="text-left py-2 pr-4 font-medium">Date</th>
                      <th className="text-left py-2 pr-4 font-medium">Type</th>
                      <th className="text-right py-2 pr-4 font-medium">Amount</th>
                      <th className="text-right py-2 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row) => (
                      <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                        <td className="py-2.5 pr-4 text-muted-foreground tabular-nums">
                          {fmtDateTime(row.created_at)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex items-center gap-1.5 font-medium ${row.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                            {row.type === 'deposit'
                              ? <ArrowDownCircle className="h-3.5 w-3.5" />
                              : <ArrowUpCircle className="h-3.5 w-3.5" />}
                            {row.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                          </span>
                        </td>
                        <td className={`py-2.5 pr-4 text-right tabular-nums font-medium ${row.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                          {row.type === 'deposit' ? '+' : '-'}{fmt(row.amount)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums font-semibold">
                          {fmt(row.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} maxAmount={summary.cash} />
    </div>
  )
}
