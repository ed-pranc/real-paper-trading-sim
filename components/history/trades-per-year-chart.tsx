'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface Transaction {
  type: string
  trade_date: string
  simulation_date: string | null
}

interface TradesPerYearChartProps {
  transactions: Transaction[]
}

const chartConfig = {
  buys:  { label: 'Buys',  color: '#22c55e' },
  sells: { label: 'Sells', color: '#ef4444' },
} satisfies ChartConfig

export function TradesPerYearChart({ transactions }: TradesPerYearChartProps) {
  const data = useMemo(() => {
    const map = new Map<string, { buys: number; sells: number }>()
    transactions.forEach(t => {
      const year = (t.simulation_date ?? t.trade_date.slice(0, 10)).slice(0, 4)
      const entry = map.get(year) ?? { buys: 0, sells: 0 }
      if (t.type === 'buy') entry.buys += 1
      else entry.sells += 1
      map.set(year, entry)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, { buys, sells }]) => ({ year, buys, sells }))
  }, [transactions])

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
        No trades yet
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-40">
      <BarChart data={data} barCategoryGap="35%" barGap={2} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="year"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis hide width={0} domain={[0, 'auto']} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="buys"  fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="sells" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}
