'use client'

import { useWallet } from '@/context/wallet'
import { LABELS } from '@/lib/labels'
import { TriangleAlert } from 'lucide-react'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function WalletFooter() {
  const { summary } = useWallet()
  const { cash, invested, pnl, realisedPnl, total, pricesOk } = summary

  const pnlClass = pnl >= 0 ? 'text-green-500' : 'text-red-500'
  const realisedClass = realisedPnl >= 0 ? 'text-green-500' : 'text-red-500'

  return (
    <footer className="shrink-0 border-t border-border bg-card">
      {/* Desktop: 5-column horizontal grid */}
      <div className="hidden sm:grid sm:grid-cols-5 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-3 px-4 border-r border-border">
          <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">{fmt(cash)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{LABELS.cash}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-4 border-r border-border">
          <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">{fmt(invested)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{LABELS.invested}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-4 border-r border-border">
          <span className={`text-xl font-bold tabular-nums tracking-tight ${pnlClass}`}>{fmt(pnl)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{LABELS.unrealisedPnl}</span>
          {!pricesOk && (
            <span className="text-[10px] text-amber-500 flex items-center gap-0.5 mt-0.5">
              <TriangleAlert className="h-3 w-3" />
              Prices unavailable
            </span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-4 border-r border-border">
          <span className={`text-xl font-bold tabular-nums tracking-tight ${realisedClass}`}>{fmt(realisedPnl)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{LABELS.realisedPnl}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-4">
          <span className="text-xl font-bold tabular-nums tracking-tight text-primary">{fmt(total)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{LABELS.totalValue}</span>
        </div>
      </div>

      {/* Mobile: vertical stack — each metric as a full-width row */}
      <div className="sm:hidden divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{LABELS.cash}</span>
          <span className="text-sm font-bold tabular-nums text-foreground">{fmt(cash)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{LABELS.invested}</span>
          <span className="text-sm font-bold tabular-nums text-foreground">{fmt(invested)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{LABELS.unrealisedPnl}</span>
          <div className="flex items-center gap-1">
            {!pricesOk && <TriangleAlert className="h-3 w-3 text-amber-500" />}
            <span className={`text-sm font-bold tabular-nums ${pnlClass}`}>{fmt(pnl)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{LABELS.realisedPnl}</span>
          <span className={`text-sm font-bold tabular-nums ${realisedClass}`}>{fmt(realisedPnl)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{LABELS.totalValue}</span>
          <span className="text-sm font-bold tabular-nums text-primary">{fmt(total)}</span>
        </div>
      </div>
    </footer>
  )
}
