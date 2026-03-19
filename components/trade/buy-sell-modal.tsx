'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { executeBuy, executeSell } from '@/lib/actions/trade'
import { useWallet } from '@/context/wallet'
import { useSimulationDate } from '@/context/simulation-date'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BuySellModalProps {
  open: boolean
  onClose: () => void
  symbol: string
  companyName: string
  price: number
  maxShares?: number // current position qty — required for sell
}

function fmt2(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function BuySellModal({
  open, onClose, symbol, companyName, price, maxShares = 0,
}: BuySellModalProps) {
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [buyAmount, setBuyAmount] = useState('')
  const [sellShares, setSellShares] = useState(0)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const { summary, refresh } = useWallet()
  const { simulationDate } = useSimulationDate()

  const buyNumeric  = parseFloat(buyAmount) || 0
  const buyShares   = price > 0 ? buyNumeric / price : 0
  const sellValue   = sellShares * price

  function handleConfirm() {
    setError('')
    if (tab === 'buy') {
      if (buyNumeric <= 0) { setError('Enter a valid amount'); return }
      if (buyNumeric > summary.cash) { setError('Insufficient funds'); return }
    } else {
      if (sellShares <= 0) { setError('Move the slider to select shares to sell'); return }
      if (sellShares > maxShares) { setError('Not enough shares'); return }
    }

    startTransition(async () => {
      try {
        if (tab === 'buy') {
          await executeBuy(symbol, companyName, buyShares, price, simulationDate)
          toast.success(`Bought ${buyShares.toFixed(4)} shares of ${symbol}`, {
            description: `$${fmt2(buyNumeric)} at $${fmt2(price)}/share`,
          })
        } else {
          await executeSell(symbol, companyName, sellShares, price, simulationDate)
          toast.success(`Sold ${sellShares.toFixed(6)} shares of ${symbol}`, {
            description: `≈ $${fmt2(sellValue)} at $${fmt2(price)}/share`,
          })
        }
        await refresh()
        setBuyAmount('')
        setSellShares(0)
        onClose()
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Trade failed'
        setError(msg)
        toast.error('Trade failed', { description: msg })
      }
    })
  }

  function setSliderPct(pct: number) {
    setSellShares(parseFloat((maxShares * pct).toFixed(6)))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{symbol}</span>
            <span className="text-sm font-normal text-muted-foreground">{companyName}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Buy / Sell toggle */}
        <div className="flex rounded-full border p-1 gap-1">
          <button
            onClick={() => { setTab('buy'); setError('') }}
            className={`flex-1 rounded-full py-1 text-sm font-medium transition-colors ${
              tab === 'buy' ? 'bg-green-600 text-white' : 'text-muted-foreground'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => { setTab('sell'); setError('') }}
            className={`flex-1 rounded-full py-1 text-sm font-medium transition-colors ${
              tab === 'sell' ? 'bg-red-600 text-white' : 'text-muted-foreground'
            }`}
          >
            Sell
          </button>
        </div>

        {tab === 'buy' ? (
          <>
            {/* Buy: $ amount input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="1,000.00"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="pl-7 text-lg"
                autoFocus
              />
            </div>

            {buyNumeric > 0 && (
              <p className="text-xs text-muted-foreground px-1">
                ≈ <span className="font-medium text-foreground">{buyShares.toFixed(6)} shares</span> at ${fmt2(price)}/share
              </p>
            )}
          </>
        ) : (
          <>
            {/* Sell: slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Shares to sell</span>
                <span className="font-medium text-foreground">
                  {sellShares.toFixed(6)} <span className="text-muted-foreground">/ {maxShares.toFixed(6)}</span>
                </span>
              </div>
              <Slider
                min={0}
                max={maxShares}
                step={maxShares / 1000000}
                value={[sellShares]}
                onValueChange={([v]) => setSellShares(parseFloat(v.toFixed(6)))}
                className="w-full"
              />
              <div className="flex gap-2">
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setSliderPct(pct)}
                    className="flex-1 text-xs py-1 rounded-full border border-border hover:bg-accent transition-colors"
                  >
                    {pct === 1 ? 'All' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
              {sellShares > 0 && (
                <p className="text-xs text-muted-foreground px-1">
                  ≈ <span className="font-medium text-foreground">${fmt2(sellValue)}</span> at ${fmt2(price)}/share
                </p>
              )}
            </div>
          </>
        )}

        {/* Stock info */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{symbol}</Badge>
            <span className="text-muted-foreground text-xs">
              {simulationDate ? `Sim: ${simulationDate}` : 'Live price'}
            </span>
          </div>
          <span className="font-semibold">${fmt2(price)}</span>
        </div>

        {/* Available balance (buy) / owned shares (sell) */}
        <div className="flex justify-between text-sm text-muted-foreground">
          {tab === 'buy' ? (
            <>
              <span>Available USD</span>
              <span className="font-medium text-foreground">
                ${summary.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </>
          ) : (
            <>
              <span>Owned shares</span>
              <span className="font-medium text-foreground">{maxShares.toFixed(6)}</span>
            </>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleConfirm}
          disabled={isPending || (tab === 'buy' ? !buyAmount : sellShares === 0)}
          className={`w-full rounded-full ${
            tab === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
          size="lg"
        >
          {isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : `${tab === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
