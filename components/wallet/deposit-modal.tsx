'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { depositFunds } from '@/lib/actions/wallet'
import { useWallet } from '@/context/wallet'

interface DepositModalProps {
  open: boolean
  onClose: () => void
}

export function DepositModal({ open, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const { refresh } = useWallet()

  function handleDeposit() {
    const value = parseFloat(amount)
    if (!value || value <= 0) {
      setError('Please enter a valid amount')
      return
    }
    setError('')
    startTransition(async () => {
      await depositFunds(value)
      await refresh()
      setAmount('')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Deposit Virtual Funds</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="deposit-amount">Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="deposit-amount"
                type="number"
                min="1"
                placeholder="10,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleDeposit()}
                autoFocus
              />
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2">
            {[1000, 5000, 10000, 50000].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                className="flex-1 rounded-full text-xs"
                onClick={() => setAmount(String(preset))}
              >
                ${preset.toLocaleString()}
              </Button>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleDeposit}
            disabled={isPending || !amount}
            className="rounded-full bg-green-600 hover:bg-green-700"
          >
            {isPending ? 'Depositing…' : 'Deposit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
