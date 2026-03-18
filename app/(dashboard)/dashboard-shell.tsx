'use client'

import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { WalletFooter } from '@/components/layout/wallet-footer'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { WalletProvider } from '@/context/wallet'
import { usePriceAlertChecker } from '@/hooks/use-price-alert-checker'
import { PriceAlertDialog } from '@/components/stock/price-alert-dialog'

interface DashboardShellProps {
  children: React.ReactNode
  userId: string
  nickname: string
}

function DashboardShellInner({ children, userId, nickname }: DashboardShellProps) {
  const { triggeredAlert, dismiss } = usePriceAlertChecker(userId)

  return (
    <SidebarProvider>
      <PriceAlertDialog alert={triggeredAlert} onDismiss={dismiss} />
      <AppSidebar nickname={nickname} />
      <SidebarInset className="flex flex-col min-h-0">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <WalletFooter />
      </SidebarInset>
    </SidebarProvider>
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
