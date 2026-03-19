'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface WalletTransaction {
  type: string
  created_at: string
}

interface DepositsPerYearChartProps {
  transactions: WalletTransaction[]
}

const chartConfig = {
  deposits:    { label: 'Deposits',    color: '#22c55e' },
  withdrawals: { label: 'Withdrawals', color: '#ef4444' },
} satisfies ChartConfig

export function DepositsPerYearChart({ transactions }: DepositsPerYearChartProps) {
  const data = useMemo(() => {
    const map = new Map<string, { deposits: number; withdrawals: number }>()
    transactions.forEach(t => {
      const year = t.created_at.slice(0, 4)
      const entry = map.get(year) ?? { deposits: 0, withdrawals: 0 }
      if (t.type === 'deposit') entry.deposits += 1
      else entry.withdrawals += 1
      map.set(year, entry)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, { deposits, withdrawals }]) => ({ year, deposits, withdrawals }))
  }, [transactions])

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
        No transactions yet
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-40">
      <BarChart data={data} barCategoryGap="35%" barGap={2}>
        <XAxis
          dataKey="year"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis hide domain={[0, 'auto']} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="deposits"    fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="withdrawals" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}
