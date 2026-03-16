'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BuySellModal } from '@/components/trade/buy-sell-modal'
import { useSimulationDate } from '@/context/simulation-date'
import { Loader2 } from 'lucide-react'

interface PortfolioRowProps {
  symbol: string
  companyName: string
  quantity: number
  avgBuyPrice: number
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function PortfolioRow({ symbol, companyName, quantity, avgBuyPrice }: PortfolioRowProps) {
  const { simulationDate } = useSimulationDate()
  const router = useRouter()
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'buy' | 'sell'>('buy')

  const fetchPrice = useCallback(async () => {
    try {
      const dateParam = simulationDate ? `&date=${simulationDate}` : ''
      const res = await fetch(`/api/market/quote?symbol=${symbol}${dateParam}`)
      const data = await res.json()
      const p = parseFloat(data?.close ?? data?.price ?? '0')
      setPrice(p)
    } finally {
      setLoading(false)
    }
  }, [symbol, simulationDate])

  useEffect(() => {
    setLoading(true)
    fetchPrice()
    const interval = setInterval(fetchPrice, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrice])

  const currentValue = price !== null ? price * quantity : avgBuyPrice * quantity
  const costBasis = avgBuyPrice * quantity
  const pnl = currentValue - costBasis
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0
  const pnlPositive = pnl >= 0

  function openModal(mode: 'buy' | 'sell') {
    setModalMode(mode)
    setModalOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border hover:bg-accent/30 transition-colors">
        {/* Symbol + name */}
        <div className="w-48 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
              {symbol.slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-sm">{symbol}</p>
              <p className="text-xs text-muted-foreground truncate max-w-32">{companyName}</p>
            </div>
          </div>
        </div>

        {/* Current price */}
        <div className="w-28 shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
            <p className="font-semibold text-sm">${fmt(price ?? 0)}</p>
          )}
        </div>

        {/* Units */}
        <div className="w-24 shrink-0">
          <p className="text-sm font-medium">{quantity.toFixed(6)}</p>
          <p className="text-xs text-muted-foreground">Long</p>
        </div>

        {/* Avg open */}
        <div className="w-24 shrink-0">
          <p className="text-sm">${fmt(avgBuyPrice)}</p>
        </div>

        {/* P/L */}
        <div className="w-28 shrink-0">
          <p className={`text-sm font-semibold ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
            {pnlPositive ? '+' : ''}${fmt(pnl)}
          </p>
          <p className={`text-xs ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
            ({pnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
          </p>
        </div>

        {/* Current value */}
        <div className="flex-1">
          <p className="text-sm font-medium">${fmt(currentValue)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="rounded-full bg-red-600 hover:bg-red-700 text-white h-8 px-4"
            disabled={loading || !price}
            onClick={() => openModal('sell')}
          >
            Close
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-green-600 hover:bg-green-700 text-white h-8 px-4"
            disabled={loading || !price}
            onClick={() => openModal('buy')}
          >
            Trade
          </Button>
        </div>
      </div>

      <BuySellModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); router.refresh() }}
        symbol={symbol}
        companyName={companyName}
        price={price ?? avgBuyPrice}
        mode={modalMode}
        maxShares={quantity}
      />
    </>
  )
}
