'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface Transaction {
  type: 'buy' | 'sell'
  pnl: number | null
}

interface WinRateRingProps {
  transactions: Transaction[]
}

const chartConfig = {
  Wins: { label: 'Wins', color: '#22c55e' },
  Losses: { label: 'Losses', color: '#ef4444' },
} satisfies ChartConfig

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
        <ChartContainer config={chartConfig} className="h-24 aspect-square">
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
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v, name) => [String(v), String(name)]}
                  hideLabel
                />
              }
            />
          </PieChart>
        </ChartContainer>
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
