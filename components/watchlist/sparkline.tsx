'use client'

import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

interface SparklineProps {
  data: { value: number }[]
  positive: boolean
}

export function Sparkline({ data, positive }: SparklineProps) {
  if (!data || data.length === 0) return <div className="w-32 h-10" />

  const color = positive ? '#22c55e' : '#ef4444'
  const gradientId = `spark-${positive ? 'pos' : 'neg'}`

  return (
    <div className="w-32 h-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={() => null}
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
  )
}
