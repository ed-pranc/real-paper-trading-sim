'use client'

import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface Transaction {
  trade_date: string
  type: string
  pnl: number | null
}

interface PnLChartProps {
  transactions: Transaction[]
}

export function PnLChart({ transactions }: PnLChartProps) {
  const data = useMemo(() => {
    // Only sell transactions contribute realised P/L
    const sells = transactions
      .filter(t => t.type === 'sell' && t.pnl != null)
      .sort((a, b) => a.trade_date.localeCompare(b.trade_date))

    if (sells.length === 0) return []

    let cumulative = 0
    return sells.map(t => {
      cumulative += Number(t.pnl ?? 0)
      return {
        date: t.trade_date.slice(0, 10),
        pnl: Math.round(cumulative * 100) / 100,
      }
    })
  }, [transactions])

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
        No realised P/L yet — sell positions to see data here
      </div>
    )
  }

  const finalPnl = data[data.length - 1]?.pnl ?? 0
  const positive = finalPnl >= 0
  const color = positive ? '#22c55e' : '#ef4444'

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={['auto', 'auto']} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <Tooltip
            formatter={(v) => {
              const n = Number(v)
              return [`${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(2)}`, 'Cumulative P/L']
            }}
            labelStyle={{ fontSize: 11 }}
            contentStyle={{ fontSize: 11 }}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={color}
            strokeWidth={2}
            fill="url(#pnlGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
