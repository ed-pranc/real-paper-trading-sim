'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Transaction {
  type: 'buy' | 'sell'
  pnl: number | null
}

interface WinRateRingProps {
  transactions: Transaction[]
}

export function WinRateRing({ transactions: txs }: WinRateRingProps) {
  const { wins, losses, winPct } = useMemo(() => {
    const sells = txs.filter(t => t.type === 'sell' && t.pnl != null)
    const wins = sells.filter(t => Number(t.pnl) > 0).length
    const losses = sells.length - wins
    const winPct = sells.length > 0 ? Math.round((wins / sells.length) * 100) : 0
    return { wins, losses, winPct }
  }, [txs])

  const data = [
    { name: 'Wins', value: wins },
    { name: 'Losses', value: losses },
  ]

  const total = wins + losses

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1">
        <span className="text-2xl font-bold text-muted-foreground">—</span>
        <span className="text-xs text-muted-foreground">No closed trades</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={42}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              <Cell fill="#22c55e" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip
              formatter={(v, name) => [v, name]}
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-bold">{winPct}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium">Win Rate</p>
        <p className="text-[10px] text-muted-foreground">{wins}W / {losses}L</p>
      </div>
    </div>
  )
}
