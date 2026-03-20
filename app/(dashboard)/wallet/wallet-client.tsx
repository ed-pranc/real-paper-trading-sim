'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { WithdrawModal } from '@/components/wallet/withdraw-modal'
import { CashDonut } from '@/components/wallet/cash-donut'
import { DepositsPerYearChart } from '@/components/wallet/deposits-per-year-chart'
import { PlusCircle, MinusCircle, TrendingUp, TrendingDown, ArrowDownCircle, ArrowUpCircle, ArrowUpDown, ArrowUp, ArrowDown, Info, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { fmtDate, fmtDateTime } from '@/lib/utils'
import { LABELS } from '@/lib/labels'
import { useWallet } from '@/context/wallet'
import { useSimulationDate } from '@/context/simulation-date'

type SortKey = 'date' | 'type' | 'amount'
type SortDir = 'asc' | 'desc'

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

export function WalletClient({ depositHistory }: { depositHistory: DepositRow[] }) {
  const { summary } = useWallet()
  const { simulationDate } = useSimulationDate()
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const pnlPositive = summary.pnl >= 0

  function isFuture(row: DepositRow): boolean {
    if (!simulationDate) return false
    return row.created_at.slice(0, 10) > simulationDate
  }

  // Running balance in chronological order; future rows don't move the balance
  const chronological = [...depositHistory].reverse()
  let running = 0
  const rowsWithBalance = chronological.map((row) => {
    const future = isFuture(row)
    if (!future) running += row.type === 'deposit' ? row.amount : -row.amount
    return { ...row, runningBalance: running, future }
  })

  const displayRows = useMemo(() => {
    return [...rowsWithBalance].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = a.created_at.localeCompare(b.created_at)
      else if (sortKey === 'type') cmp = a.type.localeCompare(b.type)
      else if (sortKey === 'amount') cmp = a.amount - b.amount
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rowsWithBalance, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />
  }

  // Tax position: only count active (non-future) rows
  const activeRows = depositHistory.filter(r => !isFuture(r))
  const totalDeposited = activeRows.filter(r => r.type === 'deposit').reduce((s, r) => s + r.amount, 0)
  const totalWithdrawn = activeRows.filter(r => r.type === 'withdraw').reduce((s, r) => s + r.amount, 0)
  const taxHeadroom = totalDeposited - totalWithdrawn

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Full-width header */}
      <div className="col-span-12">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your virtual trading balance. Deposit or withdraw funds and review your complete transaction history.
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

      {/* Deposits & withdrawals per year */}
      {depositHistory.length > 0 && (
        <div className="col-span-12">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activity per Year</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <DepositsPerYearChart transactions={depositHistory} />
            </CardContent>
          </Card>
        </div>
      )}

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
              <Table>
                <TableHeader>
                  <TableRow>
                    {(['date', 'type', 'amount'] as SortKey[]).map((k) => (
                      <TableHead
                        key={k}
                        className={`cursor-pointer select-none hover:opacity-70 transition-opacity`}
                        onClick={() => toggleSort(k)}
                      >
                        <span className={`inline-flex items-center gap-1 ${k === 'amount' ? 'justify-end w-full' : ''}`}>
                          {k.charAt(0).toUpperCase() + k.slice(1)}
                          <SortIcon k={k} />
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row) => (
                    <TableRow key={row.id} className={row.future ? 'opacity-40' : ''}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {fmtDateTime(row.created_at)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 font-medium ${row.future ? 'text-muted-foreground' : row.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                          {row.type === 'deposit'
                            ? <ArrowDownCircle className="h-3.5 w-3.5" />
                            : <ArrowUpCircle className="h-3.5 w-3.5" />}
                          {row.type === 'deposit' ? 'Deposit' : 'Withdraw'}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right tabular-nums font-medium ${row.future ? 'text-muted-foreground' : row.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                        {row.type === 'deposit' ? '+' : '-'}{fmt(row.amount)}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${row.future ? 'text-muted-foreground' : 'font-semibold'}`}>
                        {fmt(row.runningBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tax position info block */}
      {activeRows.length > 0 && (
        <div className="col-span-12">
          <div className="border rounded-lg bg-muted/30 p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm font-semibold">Investment Account Tax Position</p>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Deposited</p>
                <p className="text-lg font-bold text-green-500 mt-0.5">{fmt(totalDeposited)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Withdrawn</p>
                <p className="text-lg font-bold text-red-500 mt-0.5">{fmt(totalWithdrawn)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {taxHeadroom >= 0 ? 'Tax-Free Headroom' : 'Excess Withdrawals'}
                </p>
                <p className={`text-lg font-bold mt-0.5 ${taxHeadroom > 0 ? 'text-green-500' : taxHeadroom === 0 ? 'text-amber-500' : 'text-red-500'}`}>
                  {fmt(Math.abs(taxHeadroom))}
                </p>
              </div>
            </div>

            {/* Status line */}
            <div className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
              taxHeadroom > 0
                ? 'bg-green-600/10 text-green-700 dark:text-green-400'
                : taxHeadroom === 0
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  : 'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}>
              {taxHeadroom > 0
                ? <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                : <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>
                {taxHeadroom > 0
                  ? `You can withdraw up to ${fmt(taxHeadroom)} before reaching the taxable threshold — your withdrawals remain below your total deposited amount.`
                  : taxHeadroom === 0
                    ? 'You are at the threshold — any further withdrawal may be subject to Personal Income Tax (GPM).'
                    : `Your withdrawals exceed your deposits by ${fmt(Math.abs(taxHeadroom))}. This excess may be subject to Personal Income Tax (GPM).`}
              </span>
            </div>

            <Separator />

            {/* Educational text */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">How the Investment Account regime works</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lithuania&apos;s Investment Account (<span className="italic">Investicinė sąskaita</span>, effective 1 January 2025)
                is a deferred-taxation framework for retail investors. Gains and income generated within the account are not
                taxed annually — tax is deferred until funds are withdrawn. Withdrawals are exempt from Personal Income Tax
                (GPM) provided that the investor&apos;s cumulative withdrawals do not exceed their cumulative deposits. Once
                total withdrawals surpass total deposits, the excess is treated as a taxable gain, subject to GPM at{' '}
                <span className="font-medium text-foreground">15%</span> (or 20% where cumulative gains exceed €253,065).
                The running balance in this ledger reflects that threshold, which is why accurate deposit and withdrawal
                records are essential.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-2 mt-1">
                <span className="font-medium text-foreground">Simulation notice —</span> RPTSim is a paper trading simulator
                that uses virtual funds. No real money is deposited, invested, or withdrawn. The tax position indicator above
                is included for educational purposes only, to illustrate how the Investment Account regime operates in
                practice. It does not constitute financial or tax advice. For guidance on your personal tax obligations,
                please consult a qualified tax adviser or refer to the Lithuanian State Tax Inspectorate (VMI) at{' '}
                <span className="font-medium text-foreground">vmi.lt</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} maxAmount={summary.cash} />
    </div>
  )
}
