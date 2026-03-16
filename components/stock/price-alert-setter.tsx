'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BellIcon, Trash2Icon, Loader2Icon } from 'lucide-react'
import { createAlert, deleteAlert, getAlerts, type PriceAlert } from '@/lib/actions/alerts'
import { toast } from 'sonner'

const PRESETS = [
  { label: '−10%', pct: -0.1 },
  { label: '−5%', pct: -0.05 },
  { label: '+5%', pct: 0.05 },
  { label: '+10%', pct: 0.1 },
]

export function PriceAlertSetter({ symbol, currentPrice }: { symbol: string; currentPrice: number }) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [custom, setCustom] = useState('')
  const [isPending, startTransition] = useTransition()

  async function loadAlerts() {
    const data = await getAlerts(symbol)
    setAlerts(data)
  }

  useEffect(() => {
    loadAlerts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol])

  function handlePreset(pct: number) {
    const target = parseFloat((currentPrice * (1 + pct)).toFixed(2))
    const condition: 'above' | 'below' = pct > 0 ? 'above' : 'below'
    startTransition(async () => {
      try {
        await createAlert(symbol, target, condition)
        await loadAlerts()
        toast.success(`Alert set: ${condition} $${target}`)
      } catch {
        toast.error('Failed to create alert')
      }
    })
  }

  function handleCustom() {
    const val = parseFloat(custom)
    if (!val || val <= 0) return
    const condition: 'above' | 'below' = val > currentPrice ? 'above' : 'below'
    startTransition(async () => {
      try {
        await createAlert(symbol, val, condition)
        setCustom('')
        await loadAlerts()
        toast.success(`Alert set: ${condition} $${val.toFixed(2)}`)
      } catch {
        toast.error('Failed to create alert')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteAlert(id)
        await loadAlerts()
        toast.success('Alert removed')
      } catch {
        toast.error('Failed to delete alert')
      }
    })
  }

  return (
    <div className="px-4 space-y-3">
      <div className="flex items-center gap-2">
        <BellIcon className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Set Price Alert</p>
        {currentPrice > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">Current: ${currentPrice.toFixed(2)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            className="h-7 text-xs rounded-full px-3"
            disabled={isPending || currentPrice <= 0}
            onClick={() => handlePreset(p.pct)}
          >
            {p.label}
          </Button>
        ))}
        <div className="flex gap-1.5">
          <Input
            type="number"
            placeholder="Custom $"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            className="h-7 text-xs w-24 rounded-full px-3"
            onKeyDown={e => e.key === 'Enter' && handleCustom()}
          />
          <Button
            size="sm"
            className="h-7 text-xs rounded-full px-3"
            disabled={isPending || !custom}
            onClick={handleCustom}
          >
            {isPending ? <Loader2Icon className="size-3 animate-spin" /> : 'Set'}
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1.5">
          {alerts.map(a => (
            <div key={a.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-2.5 py-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${a.condition === 'above' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}
                >
                  {a.condition}
                </Badge>
                <span className="font-medium">${Number(a.target_price).toFixed(2)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6 text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() => handleDelete(a.id)}
              >
                <Trash2Icon className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
