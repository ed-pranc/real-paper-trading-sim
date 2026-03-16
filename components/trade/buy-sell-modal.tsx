'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { executeBuy, executeSell } from '@/lib/actions/trade'
import { useWallet } from '@/context/wallet'
import { useSimulationDate } from '@/context/simulation-date'
import { Loader2 } from 'lucide-react'

interface BuySellModalProps {
  open: boolean
  onClose: () => void
  symbol: string
  companyName: string
  price: number
  mode?: 'buy' | 'sell'
  maxShares?: number // for sell: current position qty
}

export function BuySellModal({
  open, onClose, symbol, companyName, price, mode = 'buy', maxShares
}: BuySellModalProps) {
  const [tab, setTab] = useState<'buy' | 'sell'>(mode)
  const [inputMode, setInputMode] = useState<'amount' | 'shares'>('amount')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const { summary, refresh } = useWallet()
  const { simulationDate } = useSimulationDate()

  const numValue = parseFloat(value) || 0
  const shares = inputMode === 'amount' ? numValue / price : numValue
  const amount = inputMode === 'shares' ? numValue * price : numValue

  function handleConfirm() {
    if (!numValue || numValue <= 0) { setError('Enter a valid amount'); return }
    if (tab === 'buy' && amount > summary.cash) { setError('Insufficient funds'); return }
    if (tab === 'sell' && maxShares && shares > maxShares) { setError('Not enough shares'); return }

    setError('')
    startTransition(async () => {
      try {
        if (tab === 'buy') {
          await executeBuy(symbol, companyName, shares, price, simulationDate)
        } else {
          await executeSell(symbol, companyName, shares, price, simulationDate)
        }
        await refresh()
        setValue('')
        onClose()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Trade failed')
      }
    })
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
            onClick={() => setTab('buy')}
            className={`flex-1 rounded-full py-1 text-sm font-medium transition-colors ${
              tab === 'buy' ? 'bg-green-600 text-white' : 'text-muted-foreground'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTab('sell')}
            className={`flex-1 rounded-full py-1 text-sm font-medium transition-colors ${
              tab === 'sell' ? 'bg-red-600 text-white' : 'text-muted-foreground'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Input mode toggle */}
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => { setInputMode('amount'); setValue('') }}
            className={`px-3 py-1 rounded-full border transition-colors ${
              inputMode === 'amount' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground'
            }`}
          >
            $ Amount
          </button>
          <button
            onClick={() => { setInputMode('shares'); setValue('') }}
            className={`px-3 py-1 rounded-full border transition-colors ${
              inputMode === 'shares' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground'
            }`}
          >
            Shares
          </button>
        </div>

        {/* Amount input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {inputMode === 'amount' ? '$' : '#'}
          </span>
          <Input
            type="number"
            min="0"
            step={inputMode === 'shares' ? '0.000001' : '1'}
            placeholder={inputMode === 'amount' ? '1,000.00' : '0.000000'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="pl-7 text-lg"
            autoFocus
          />
        </div>

        {/* Live calculation */}
        {numValue > 0 && (
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 rounded-md px-3 py-2">
            <div className="flex justify-between">
              <span>{inputMode === 'amount' ? 'Shares' : 'Total cost'}</span>
              <span className="font-medium text-foreground">
                {inputMode === 'amount'
                  ? shares.toFixed(6)
                  : `$${amount.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Price per share</span>
              <span className="font-medium text-foreground">${price.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Stock info */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{symbol}</Badge>
            <span className="text-muted-foreground text-xs">
              {simulationDate ? `Sim: ${simulationDate}` : 'Live price'}
            </span>
          </div>
          <span className="font-semibold">${price.toFixed(2)}</span>
        </div>

        {/* Available balance */}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Available USD</span>
          <span className="font-medium text-foreground">
            ${summary.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleConfirm}
          disabled={isPending || !value}
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
