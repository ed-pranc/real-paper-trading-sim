'use client'

import { useWallet } from '@/context/wallet'
import { useSimulationDate } from '@/context/simulation-date'
import { LABELS } from '@/lib/labels'
import { Badge } from '@/components/ui/badge'
import { TriangleAlert } from 'lucide-react'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function WalletFooter() {
  const { summary } = useWallet()
  const { simulationDate, setSimulationDate } = useSimulationDate()
  const { cash, invested, pnl, realisedPnl, total, pricesOk } = summary

  const isSim = simulationDate !== null
  const pnlClass = pnl >= 0 ? 'text-green-500' : 'text-red-500'
  const realisedClass = realisedPnl >= 0 ? 'text-green-500' : 'text-red-500'

  const colClass = isSim ? 'grid-cols-5' : 'grid-cols-4'

  return (
    <footer className="shrink-0 border-t border-border bg-card">
      <div className={`max-w-7xl mx-auto grid ${colClass}`}>

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

        {isSim && (
          <div className="flex flex-col items-center justify-center py-3 px-4 border-r border-border">
            <span className={`text-xl font-bold tabular-nums tracking-tight ${realisedClass}`}>{fmt(realisedPnl)}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{LABELS.realisedPnl}</span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-3 px-4">
          <span className="text-xl font-bold tabular-nums tracking-tight text-primary">{fmt(total)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{LABELS.totalValue}</span>
          {isSim && (
            <Badge
              onClick={() => setSimulationDate(null)}
              className="bg-green-600 text-white hover:bg-green-700 cursor-pointer mt-1"
            >
              GO LIVE
            </Badge>
          )}
        </div>

      </div>
    </footer>
  )
}
