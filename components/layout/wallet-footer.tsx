'use client'

import { useWallet } from '@/context/wallet'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

interface FooterBlockProps {
  label: string
  value: string
  valueClass?: string
  showDivider?: boolean
}

function FooterBlock({ label, value, valueClass = 'text-foreground', showDivider = true }: FooterBlockProps) {
  return (
    <>
      <div className="col-span-3 flex flex-col items-center justify-center py-3 px-4">
        <span className={`text-xl font-bold tabular-nums tracking-tight ${valueClass}`}>{value}</span>
        <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</span>
      </div>
      {showDivider && <div className="col-span-0 w-px self-stretch bg-border my-2" />}
    </>
  )
}

export function WalletFooter() {
  const { summary } = useWallet()
  const { cash, invested, pnl, total } = summary

  const pnlClass = pnl >= 0 ? 'text-green-500' : 'text-red-500'

  return (
    <footer className="shrink-0 border-t border-border bg-card">
      <div className="max-w-7xl mx-auto grid grid-cols-12">
        <div className="col-span-3 flex flex-col items-center justify-center py-3 px-4 border-r border-border">
          <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">{fmt(cash)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">Available Cash</span>
        </div>

        <div className="col-span-3 flex flex-col items-center justify-center py-3 px-4 border-r border-border">
          <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">{fmt(invested)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">Total Invested</span>
        </div>

        <div className="col-span-3 flex flex-col items-center justify-center py-3 px-4 border-r border-border">
          <span className={`text-xl font-bold tabular-nums tracking-tight ${pnlClass}`}>{fmt(pnl)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">Profit / Loss</span>
        </div>

        <div className="col-span-3 flex flex-col items-center justify-center py-3 px-4">
          <span className="text-xl font-bold tabular-nums tracking-tight text-primary">{fmt(total)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">Total Value</span>
        </div>
      </div>
    </footer>
  )
}
