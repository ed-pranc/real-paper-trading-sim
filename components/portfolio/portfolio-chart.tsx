'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'

const PERIODS = ['1D', '1W', '1M', '6M', '1Y', '2Y', '5Y', '10Y'] as const
type Period = typeof PERIODS[number]

const TIMESERIES_CONFIG: Record<Period, { interval: string; outputsize: string; intraday: boolean }> = {
  '1D':  { interval: '15min',  outputsize: '26',  intraday: true },
  '1W':  { interval: '1h',     outputsize: '42',  intraday: true },
  '1M':  { interval: '1day',   outputsize: '22',  intraday: false },
  '6M':  { interval: '1day',   outputsize: '130', intraday: false },
  '1Y':  { interval: '1week',  outputsize: '52',  intraday: false },
  '2Y':  { interval: '1week',  outputsize: '104', intraday: false },
  '5Y':  { interval: '1month', outputsize: '60',  intraday: false },
  '10Y': { interval: '1month', outputsize: '120', intraday: false },
}

function formatTick(datetime: string, intraday: boolean): string {
  if (intraday) {
    return datetime.split(' ')[1]?.slice(0, 5) ?? datetime
  }
  const d = new Date(datetime + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface PortfolioChartProps {
  symbols: { symbol: string; quantity: number }[]
  simulationDate: string | null
}

export function PortfolioChart({ symbols, simulationDate }: PortfolioChartProps) {
  const [period, setPeriod] = useState<Period>('1Y')
  const [chartData, setChartData] = useState<{ date: string; value: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (symbols.length === 0) return

    async function fetchTimeSeries() {
      setLoading(true)
      setChartData([])
      const cfg = TIMESERIES_CONFIG[period]
      const endParam = simulationDate ? `&end_date=${simulationDate}` : ''

      const seriesResults = await Promise.all(
        symbols.map(({ symbol }) =>
          fetch(`/api/market/timeseries?symbol=${symbol}&interval=${cfg.interval}&outputsize=${cfg.outputsize}${endParam}`)
            .then(r => r.json())
            .catch(() => null)
        )
      )

      if (seriesResults.every(r => !r || r.error)) {
        setLoading(false)
        return
      }

      const dateMap: Record<string, number> = {}
      seriesResults.forEach((res, i) => {
        const qty = symbols[i].quantity
        const values: { datetime: string; close: string }[] = res?.values ?? []
        values.forEach(({ datetime, close }) => {
          dateMap[datetime] = (dateMap[datetime] ?? 0) + parseFloat(close) * qty
        })
      })

      const sorted = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }))

      setChartData(sorted)
      setLoading(false)
    }

    fetchTimeSeries()
  }, [period, symbols, simulationDate])

  const positive = chartData.length < 2 || chartData[chartData.length - 1]?.value >= chartData[0]?.value
  const isIntraday = TIMESERIES_CONFIG[period].intraday

  return (
    <div className="space-y-3">
      {/* Period selector */}
      <div className="flex gap-1 flex-wrap">
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
      ) : chartData.length > 1 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={positive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={positive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tickFormatter={(v) => formatTick(v, isIntraday)}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v) => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Portfolio Value']}
                labelFormatter={(label) => formatTick(label, isIntraday)}
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
          {loading ? '' : `No data available for ${period}.`}
        </div>
      )}
    </div>
  )
}
