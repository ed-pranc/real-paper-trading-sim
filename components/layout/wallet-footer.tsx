'use client'

import { useWallet } from '@/context/wallet'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function WalletFooter() {
  const { summary } = useWallet()
  const { cash, invested, pnl, total } = summary

  return (
    <footer className="shrink-0 border-t border-border bg-card px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>
          Available: <span className="text-foreground font-medium">{fmt(cash)}</span>
        </span>
        <span>
          Invested: <span className="text-foreground font-medium">{fmt(invested)}</span>
        </span>
        <span>
          P/L:{' '}
          <span className={pnl >= 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
            {fmt(pnl)}
          </span>
        </span>
        <span>
          Total Value: <span className="text-foreground font-medium">{fmt(total)}</span>
        </span>
      </div>
    </footer>
  )
}
