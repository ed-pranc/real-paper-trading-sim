'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'

const PERIODS = ['1D', '1W', '1M', '6M', '1Y', '2Y', '5Y', 'All'] as const
type Period = typeof PERIODS[number]

const PERIOD_DAYS: Record<Period, number> = {
  '1D': 1, '1W': 7, '1M': 30, '6M': 180,
  '1Y': 365, '2Y': 730, '5Y': 1825, 'All': Infinity,
}

// Fallback time-series config when no snapshots exist
const TIMESERIES_CONFIG: Record<Period, { interval: string; outputsize: string; intraday: boolean }> = {
  '1D':  { interval: '15min',  outputsize: '26',  intraday: true },
  '1W':  { interval: '1h',     outputsize: '42',  intraday: true },
  '1M':  { interval: '1day',   outputsize: '22',  intraday: false },
  '6M':  { interval: '1day',   outputsize: '130', intraday: false },
  '1Y':  { interval: '1week',  outputsize: '52',  intraday: false },
  '2Y':  { interval: '1week',  outputsize: '104', intraday: false },
  '5Y':  { interval: '1month', outputsize: '60',  intraday: false },
  'All': { interval: '1month', outputsize: '120', intraday: false },
}

function formatTick(datetime: string, intraday: boolean): string {
  if (intraday) {
    return datetime.split(' ')[1]?.slice(0, 5) ?? datetime
  }
  const d = new Date(datetime + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Snapshot {
  snapshot_date: string
  total_value: number
}

interface PortfolioChartProps {
  symbols: { symbol: string; quantity: number }[]
  simulationDate: string | null
  snapshots: Snapshot[]
}

function filterSnapshotsByPeriod(snapshots: Snapshot[], period: Period): Snapshot[] {
  if (period === 'All' || snapshots.length === 0) return snapshots
  const last = new Date(snapshots[snapshots.length - 1].snapshot_date + 'T00:00:00')
  const cutoff = new Date(last)
  cutoff.setDate(cutoff.getDate() - PERIOD_DAYS[period])
  return snapshots.filter(s => new Date(s.snapshot_date + 'T00:00:00') >= cutoff)
}

export function PortfolioChart({ symbols, simulationDate, snapshots }: PortfolioChartProps) {
  const [period, setPeriod] = useState<Period>('All')
  const [tsData, setTsData] = useState<{ date: string; value: number }[]>([])
  const [loading, setLoading] = useState(false)

  // Only fall back to time-series fetch when there are no snapshots at all
  const useSnapshots = snapshots.length > 0

  useEffect(() => {
    if (useSnapshots || symbols.length === 0) return

    async function fetchTimeSeries() {
      setLoading(true)
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

      setTsData(sorted)
      setLoading(false)
    }

    fetchTimeSeries()
  }, [period, symbols, simulationDate, useSnapshots])

  // Build chart data from snapshots or time-series fallback
  const chartData = useSnapshots
    ? filterSnapshotsByPeriod(snapshots, period).map(s => ({
        date: s.snapshot_date,
        value: Math.round(Number(s.total_value) * 100) / 100,
      }))
    : tsData

  const positive = chartData.length < 2 || chartData[chartData.length - 1]?.value >= chartData[0]?.value
  const isIntraday = !useSnapshots && TIMESERIES_CONFIG[period].intraday

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
                dot={useSnapshots}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : chartData.length === 1 ? (
        <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-1">
          <p>First trade recorded on <strong>{chartData[0].date}</strong></p>
          <p>Make another trade to see your portfolio history.</p>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          {useSnapshots ? 'No trades recorded yet.' : 'Not enough data for this period.'}
        </div>
      )}
    </div>
  )
}
