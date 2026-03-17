'use client'

import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { TooltipProps } from 'recharts'

interface SparklineProps {
  data: { value: number; datetime: string }[]
  positive: boolean
}

function SparkTooltip({ active, payload }: TooltipProps<number, string> & { payload?: { payload: { value: number; datetime: string } }[] }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  const price = `$${point.value.toFixed(2)}`
  // Append T00:00:00 to parse as local time and avoid UTC timezone shift (e.g. Mar 11 → Mar 10)
  const d = new Date(point.datetime + 'T00:00:00')
  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return (
    <div className="bg-popover border border-border rounded px-2 py-1 shadow-md pointer-events-none">
      <p className="text-[10px] font-semibold tabular-nums">{price}</p>
      <p className="text-[9px] text-muted-foreground">{dateLabel}</p>
    </div>
  )
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

  return (
    <div className="flex items-center gap-1 w-full h-10">
      {/* Start price label */}
      <span className="text-[9px] tabular-nums text-muted-foreground shrink-0 leading-none w-12 text-right">
        ${data[0].value.toFixed(2)}
      </span>

      {/* Chart */}
      <div className="flex-1 h-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={domain} />
            <Tooltip
              content={<SparkTooltip />}
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
        </ResponsiveContainer>
      </div>

      {/* End price label */}
      <span className="text-[9px] tabular-nums text-muted-foreground shrink-0 leading-none w-12 text-left">
        ${data[data.length - 1].value.toFixed(2)}
      </span>
    </div>
  )
}
