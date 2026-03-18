'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { withdrawFunds } from '@/lib/actions/wallet'
import { useWallet } from '@/context/wallet'
import confetti from 'canvas-confetti'

interface WithdrawModalProps {
  open: boolean
  onClose: () => void
  maxAmount: number
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function fireFireworks() {
  const duration = 3000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
    })
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export function WithdrawModal({ open, onClose, maxAmount }: WithdrawModalProps) {
  const [amount, setAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [happiness, setHappiness] = useState(false)
  const { refresh } = useWallet()

  function handleClose() {
    setAmount('')
    setError('')
    setHappiness(false)
    onClose()
  }

  function handleWithdraw() {
    const value = parseFloat(amount)
    if (!value || value <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (value > maxAmount) {
      setError(`Insufficient cash balance (max ${fmt(maxAmount)})`)
      return
    }
    setError('')
    startTransition(async () => {
      await withdrawFunds(value)
      await refresh()
      setHappiness(true)
      fireFireworks()
    })
  }

  const happinessUnits = amount ? Math.floor(parseFloat(amount) / 1000) : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        {!happiness ? (
          <>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">This is a simulation account.</p>
                <p>
                  All funds are virtual — but we can exchange them for happiness at a rate of{' '}
                  <span className="font-medium text-foreground">$1,000 = 1 unit of happiness</span>.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="withdraw-amount">Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    min="1"
                    max={maxAmount}
                    placeholder="10,000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7 text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleWithdraw()}
                    autoFocus
                  />
                </div>
              </div>

              {happinessUnits > 0 && (
                <p className="text-sm text-center text-muted-foreground">
                  That&apos;s{' '}
                  <span className="font-semibold text-foreground">{happinessUnits} unit{happinessUnits !== 1 ? 's' : ''} of happiness</span>{' '}
                  {'😊'.repeat(Math.min(happinessUnits, 10))}
                </p>
              )}

              {/* Quick amount buttons */}
              <div className="flex gap-2">
                {[1000, 5000, 10000, 50000].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-full text-xs"
                    onClick={() => setAmount(String(preset))}
                    disabled={preset > maxAmount}
                  >
                    ${preset.toLocaleString()}
                  </Button>
                ))}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={isPending || !amount}
                className="rounded-full bg-green-600 hover:bg-green-700"
              >
                {isPending ? 'Withdrawing…' : 'Yes, give me happiness!'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Happiness Delivered! 🎉</DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center space-y-3">
              <p className="text-5xl">🎊🎆🎇</p>
              <p className="text-lg font-semibold">
                {fmt(parseFloat(amount))} successfully exchanged for happiness!
              </p>
              <p className="text-sm text-muted-foreground">
                Your {happinessUnits} unit{happinessUnits !== 1 ? 's' : ''} of happiness
                {happinessUnits !== 1 ? ' have' : ' has'} been delivered to your soul.
              </p>
            </div>
            <DialogFooter>
              <Button className="w-full rounded-full bg-green-600 hover:bg-green-700" onClick={handleClose}>
                Wonderful, thank you!
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
