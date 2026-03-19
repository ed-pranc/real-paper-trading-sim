'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'
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

const chartConfig = { count: { label: 'Trades' } } satisfies ChartConfig

export function TradesPerYearChart({ transactions }: TradesPerYearChartProps) {
  const data = useMemo(() => {
    const map = new Map<string, number>()
    transactions.forEach(t => {
      const year = (t.simulation_date ?? t.trade_date.slice(0, 10)).slice(0, 4)
      map.set(year, (map.get(year) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, count }))
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
      <BarChart data={data} barCategoryGap="35%">
        <XAxis
          dataKey="year"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis hide domain={[0, 'auto']} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => [v, v === 1 ? 'trade' : 'trades']}
            />
          }
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill="hsl(var(--primary))" />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
