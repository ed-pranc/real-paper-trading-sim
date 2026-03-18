'use client'

import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface CashDonutProps {
  cash: number
  invested: number
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function CashDonut({ cash, invested }: CashDonutProps) {
  const total = cash + invested
  const investedPct = total > 0 ? ((invested / total) * 100).toFixed(0) : '0'
  const cashPct = total > 0 ? ((cash / total) * 100).toFixed(0) : '0'

  const data = [
    { name: 'Invested', value: invested },
    { name: 'Cash', value: cash },
  ]

  const chartConfig = {
    Invested: { label: 'Invested', color: '#22c55e' },
    Cash: { label: 'Cash', color: 'hsl(var(--muted-foreground) / 0.2)' },
  } satisfies ChartConfig

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <ChartContainer config={chartConfig} className="h-36 aspect-square">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={64}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              <Cell fill="#22c55e" />
              <Cell fill="hsl(var(--muted-foreground) / 0.2)" />
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
          <span className="text-lg font-bold">{investedPct}%</span>
          <span className="text-[10px] text-muted-foreground">Invested</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Invested {investedPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          <span className="text-muted-foreground">Cash {cashPct}%</span>
        </div>
      </div>
    </div>
  )
}
