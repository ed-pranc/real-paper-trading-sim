'use client'

import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, ReferenceLine } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface Transaction {
  type: string
  total: number
  trade_date: string
  simulation_date: string | null
}

interface TradesInvestedChartProps {
  transactions: Transaction[]
}

const chartConfig = { invested: { label: 'Total Invested' } } satisfies ChartConfig

export function TradesInvestedChart({ transactions }: TradesInvestedChartProps) {
  const data = useMemo(() => {
    const buys = transactions
      .filter(t => t.type === 'buy')
      .map(t => ({
        date: t.simulation_date ?? t.trade_date.slice(0, 10),
        total: Number(t.total),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    if (buys.length === 0) return []

    const firstDate = new Date(buys[0].date + 'T00:00:00')
    firstDate.setDate(firstDate.getDate() - 1)
    const baseline = { date: firstDate.toISOString().slice(0, 10), invested: 0 }

    let cumulative = 0
    const points = buys.map(b => {
      cumulative += b.total
      return { date: b.date, invested: Math.round(cumulative * 100) / 100 }
    })
    return [baseline, ...points]
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
      <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickFormatter={(v: string) => {
            const d = new Date(v + 'T00:00:00')
            return d.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
          }}
        />
        <YAxis hide width={0} domain={[0, 'auto']} />
        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v) => {
                const n = Number(v)
                return [`$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Total Invested']
              }}
              labelFormatter={(label: string) => {
                const d = new Date(label + 'T00:00:00')
                return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
              }}
            />
          }
        />
        <Area
          type="stepAfter"
          dataKey="invested"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#investedGrad)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
