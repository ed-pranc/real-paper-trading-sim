'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { WalletFooter } from '@/components/layout/wallet-footer'
import { Sheet, SheetContent } from '@/components/ui/sheet'

// TODO: replace with real wallet data from Supabase
const MOCK_WALLET = { available: 10000, invested: 0, pnl: 0 }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      <AppHeader onMenuToggle={() => setSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-56 shrink-0">
          <AppSidebar />
        </div>

        {/* Mobile sidebar (Sheet) */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-56 p-0">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <WalletFooter {...MOCK_WALLET} />
    </div>
  )
}
