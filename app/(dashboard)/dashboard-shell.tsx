'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { WalletFooter } from '@/components/layout/wallet-footer'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { WalletProvider } from '@/context/wallet'
import { usePriceAlertChecker } from '@/hooks/use-price-alert-checker'
import { PriceAlertDialog } from '@/components/stock/price-alert-dialog'

interface DashboardShellProps {
  children: React.ReactNode
  userId: string
  nickname: string
}

function DashboardShellInner({ children, userId, nickname }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { triggeredAlert, dismiss } = usePriceAlertChecker(userId)

  return (
    <>
      <PriceAlertDialog alert={triggeredAlert} onDismiss={dismiss} />
      <div className="flex flex-col h-screen bg-muted/40">
        <AppHeader onMenuToggle={() => setSidebarOpen(true)} nickname={nickname} />

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden lg:flex w-56 shrink-0">
            <AppSidebar nickname={nickname} />
          </div>

          {/* Mobile sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-56 p-0">
              <AppSidebar nickname={nickname} />
            </SheetContent>
          </Sheet>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        <WalletFooter />
      </div>
    </>
  )
}

export function DashboardShell({ children, userId, nickname }: DashboardShellProps) {
  return (
    <WalletProvider userId={userId}>
      <DashboardShellInner userId={userId} nickname={nickname}>
        {children}
      </DashboardShellInner>
    </WalletProvider>
  )
}
