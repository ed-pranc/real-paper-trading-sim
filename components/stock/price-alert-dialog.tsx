'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import type { TriggeredAlert } from '@/hooks/use-price-alert-checker'

interface PriceAlertDialogProps {
  alert: TriggeredAlert | null
  onDismiss: () => void
}

export function PriceAlertDialog({ alert, onDismiss }: PriceAlertDialogProps) {
  const isAbove = alert?.condition === 'above'

  return (
    <AlertDialog open={alert !== null} onOpenChange={open => { if (!open) onDismiss() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <span>Price Alert Triggered</span>
          </AlertDialogTitle>
          {alert && (
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-1">
                <div className="text-2xl font-bold text-foreground">
                  {alert.symbol}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current price{' '}
                  <span className={`font-semibold ${isAbove ? 'text-green-500' : 'text-red-500'}`}>
                    ${alert.currentPrice.toFixed(2)}
                  </span>{' '}
                  has gone{' '}
                  <span className="font-semibold text-foreground">
                    {isAbove ? 'above' : 'below'}
                  </span>{' '}
                  your target of{' '}
                  <span className="font-semibold text-foreground">
                    ${alert.target_price.toFixed(2)}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDismiss}>
            Dismiss
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
