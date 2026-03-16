'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

const PERIODS = ['1D', '1W', '1M', '6M', '1Y'] as const
type Period = typeof PERIODS[number]

const PERIOD_CONFIG: Record<Period, { interval: string; outputsize: string }> = {
  '1D': { interval: '15min', outputsize: '26' },
  '1W': { interval: '1h',    outputsize: '42' },
  '1M': { interval: '1day',  outputsize: '22' },
  '6M': { interval: '1day',  outputsize: '130' },
  '1Y': { interval: '1week', outputsize: '52' },
}

interface StockChartProps {
  symbol: string
  simulationDate: string | null
}

export function StockChart({ symbol, simulationDate }: StockChartProps) {
  const [period, setPeriod] = useState<Period>('1D')
  const [data, setData] = useState<{ date: string; price: number; volume: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    setLoading(true)

    async function fetchChart() {
      const cfg = PERIOD_CONFIG[period]
      const endParam = simulationDate ? `&end_date=${simulationDate}` : ''
      try {
        const res = await fetch(
          `/api/market/timeseries?symbol=${symbol}&interval=${cfg.interval}&outputsize=${cfg.outputsize}${endParam}`
        )
        const json = await res.json()
        const values: { datetime: string; close: string; volume?: string }[] = json?.values ?? []
        const sorted = [...values]
          .sort((a, b) => a.datetime.localeCompare(b.datetime))
          .map(v => ({
            date: v.datetime.length > 10 ? v.datetime.slice(11, 16) : v.datetime,
            price: parseFloat(v.close),
            volume: parseFloat(v.volume ?? '0'),
          }))
        setData(sorted)
        setLastUpdated(new Date().toLocaleTimeString())
      } finally {
        setLoading(false)
      }
    }

    fetchChart()
    const interval = setInterval(fetchChart, 60_000)
    return () => clearInterval(interval)
  }, [symbol, period, simulationDate])

  const positive = data.length < 2 || data[data.length - 1]?.price >= data[0]?.price
  const color = positive ? '#22c55e' : '#ef4444'
  const hasVolume = data.some(d => d.volume > 0)

  return (
    <div className="space-y-3">
      {/* Period selector + last updated */}
      <div className="flex items-center justify-between">
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
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            {loading && <Loader2 className="h-3 w-3 animate-spin inline mr-1" />}
            Last updated: {lastUpdated}
          </span>
        )}
      </div>

      {loading && data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading chart…
        </div>
      ) : data.length > 1 ? (
        <div className="space-y-1">
          {/* Price chart */}
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Tooltip
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Price']}
                  labelStyle={{ fontSize: 11 }}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  fill="url(#stockGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Volume bars */}
          {hasVolume && (
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barCategoryGap="10%">
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    formatter={(v) => [Number(v).toLocaleString(), 'Volume']}
                    labelStyle={{ fontSize: 11 }}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Bar dataKey="volume" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                    {data.map((_, i) => (
                      <Cell key={i} fill={color} opacity={0.4} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {hasVolume && (
            <p className="text-[10px] text-muted-foreground text-right pr-1">Volume</p>
          )}
        </div>
      ) : (
        <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
          No chart data available
        </div>
      )}
    </div>
  )
}
