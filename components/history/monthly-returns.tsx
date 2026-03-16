'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'

interface Transaction {
  type: 'buy' | 'sell'
  pnl: number | null
  trade_date: string
}

interface MonthlyReturnsProps {
  transactions: Transaction[]
}

function fmtMonth(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function MonthlyReturns({ transactions }: MonthlyReturnsProps) {
  const data = useMemo(() => {
    const map = new Map<string, number>()
    transactions
      .filter(t => t.type === 'sell' && t.pnl != null)
      .forEach(t => {
        const key = t.trade_date.slice(0, 7) // YYYY-MM
        map.set(key, (map.get(key) ?? 0) + Number(t.pnl))
      })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, pnl]) => ({ month: fmtMonth(key), pnl, positive: pnl >= 0 }))
  }, [transactions])

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
        No realised P/L data yet
      </div>
    )
  }

  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            hide
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(v) => [`${Number(v) >= 0 ? '+' : ''}$${Number(v).toFixed(2)}`, 'P/L']}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
          <Bar dataKey="pnl" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.positive ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
