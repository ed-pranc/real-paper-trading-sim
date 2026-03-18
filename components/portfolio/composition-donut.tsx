'use client'

import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface Position {
  symbol: string
  quantity: number
  avgBuyPrice: number
}

interface CompositionDonutProps {
  positions: Position[]
}

const PALETTE = [
  '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#10b981',
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function CompositionDonut({ positions }: CompositionDonutProps) {
  const data = positions.map((p, i) => ({
    name: p.symbol,
    value: p.quantity * p.avgBuyPrice,
    color: PALETTE[i % PALETTE.length],
  }))

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) return null

  const chartConfig = Object.fromEntries(
    data.map((d, i) => [d.name, { label: d.name, color: PALETTE[i % PALETTE.length] }])
  ) satisfies ChartConfig

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <ChartContainer config={chartConfig} className="h-44 aspect-square">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={74}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v, name) => [fmt(Number(v)), String(name)]}
                  hideLabel
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-muted-foreground">Cost Basis</span>
          <span className="text-sm font-bold">{fmt(total)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">
              {d.name} {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
