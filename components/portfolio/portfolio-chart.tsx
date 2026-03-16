'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'

const PERIODS = ['1D', '1W', '1M', '6M', '1Y', '2Y', '5Y', 'All'] as const
type Period = typeof PERIODS[number]

const PERIOD_CONFIG: Record<Period, { interval: string; outputsize: string }> = {
  '1D':  { interval: '15min', outputsize: '26' },
  '1W':  { interval: '1h',    outputsize: '42' },
  '1M':  { interval: '1day',  outputsize: '22' },
  '6M':  { interval: '1day',  outputsize: '130' },
  '1Y':  { interval: '1week', outputsize: '52' },
  '2Y':  { interval: '1week', outputsize: '104' },
  '5Y':  { interval: '1month', outputsize: '60' },
  'All': { interval: '1month', outputsize: '120' },
}

interface PortfolioChartProps {
  symbols: { symbol: string; quantity: number }[]
  simulationDate: string | null
}

export function PortfolioChart({ symbols, simulationDate }: PortfolioChartProps) {
  const [period, setPeriod] = useState<Period>('1M')
  const [data, setData] = useState<{ date: string; value: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (symbols.length === 0) return

    async function fetchChart() {
      setLoading(true)
      const cfg = PERIOD_CONFIG[period]
      const endParam = simulationDate ? `&end_date=${simulationDate}` : ''

      const seriesResults = await Promise.all(
        symbols.map(({ symbol }) =>
          fetch(`/api/market/timeseries?symbol=${symbol}&interval=${cfg.interval}&outputsize=${cfg.outputsize}${endParam}`)
            .then(r => r.json())
        )
      )

      // Merge all series into portfolio value by date
      const dateMap: Record<string, number> = {}
      seriesResults.forEach((res, i) => {
        const qty = symbols[i].quantity
        const values: { datetime: string; close: string }[] = res?.values ?? []
        values.forEach(({ datetime, close }) => {
          const key = datetime.split(' ')[0]
          dateMap[key] = (dateMap[key] ?? 0) + parseFloat(close) * qty
        })
      })

      const sorted = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }))

      setData(sorted)
      setLoading(false)
    }

    fetchChart()
  }, [period, symbols, simulationDate])

  const positive = data.length < 2 || data[data.length - 1]?.value >= data[0]?.value

  return (
    <div className="space-y-3">
      {/* Period selector */}
      <div className="flex gap-1">
        {PERIODS.map(p => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'ghost'}
            size="sm"
            className="rounded-full h-7 px-3 text-xs"
            onClick={() => setPeriod(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Loading chart…
        </div>
      ) : data.length > 1 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={positive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={positive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Value']}
                labelStyle={{ fontSize: 11 }}
                contentStyle={{ fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={positive ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                fill="url(#portfolioGrad)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Not enough data for this period
        </div>
      )}
    </div>
  )
}
