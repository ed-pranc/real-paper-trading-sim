'use client'

import { AreaChart, Area, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface SparklineProps {
  data: { value: number; datetime: string }[]
  positive: boolean
}

export function Sparkline({ data, positive }: SparklineProps) {
  if (!data || data.length === 0) return <div className="w-52 h-10" />

  const color = positive ? '#22c55e' : '#ef4444'
  const gradientId = `spark-${positive ? 'pos' : 'neg'}`
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.05 || min * 0.01
  const domain: [number, number] = [min - pad, max + pad]

  const chartConfig = { value: { label: 'Price' } } satisfies ChartConfig

  return (
    <div className="flex items-center gap-1 w-full h-10">
      {/* Start price label */}
      <span className="text-[9px] tabular-nums text-muted-foreground shrink-0 leading-none w-12 text-right">
        ${data[0].value.toFixed(2)}
      </span>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="flex-1 h-10">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={domain} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Price']}
                labelFormatter={(_, payload) => {
                  const datetime = payload?.[0]?.payload?.datetime as string | undefined
                  if (!datetime) return ''
                  const d = new Date(datetime + 'T00:00:00')
                  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                }}
              />
            }
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>

      {/* End price label */}
      <span className="text-[9px] tabular-nums text-muted-foreground shrink-0 leading-none w-12 text-left">
        ${data[data.length - 1].value.toFixed(2)}
      </span>
    </div>
  )
}
