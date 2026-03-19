'use client'

import { useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { WalletFooter } from '@/components/layout/wallet-footer'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { WalletProvider } from '@/context/wallet'
import { usePriceAlertChecker } from '@/hooks/use-price-alert-checker'
import { PriceAlertDialog } from '@/components/stock/price-alert-dialog'
import { ProfileModal } from '@/components/profile/profile-modal'
import { useRouter } from 'next/navigation'

interface ProfileData {
  nickname: string | null
  first_name: string | null
  last_name: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  postal_code: string | null
  country: string | null
}

interface DashboardShellProps {
  children: React.ReactNode
  userId: string
  nickname: string
  profile: ProfileData | null
  email: string
}

function DashboardShellInner({ children, userId, nickname, profile, email }: DashboardShellProps) {
  const { triggeredAlert, dismiss } = usePriceAlertChecker(userId)
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()

  function handleProfileSave() {
    setProfileOpen(false)
    router.refresh()
  }

  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <PriceAlertDialog alert={triggeredAlert} onDismiss={dismiss} />
      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        profile={profile}
        email={email}
        onSaveSuccess={handleProfileSave}
      />
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-0">
        <AppHeader nickname={nickname} onOpenProfile={() => setProfileOpen(true)} />
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

export function DashboardShell({ children, userId, nickname, profile, email }: DashboardShellProps) {
  return (
    <WalletProvider userId={userId}>
      <DashboardShellInner userId={userId} nickname={nickname} profile={profile} email={email}>
        {children}
      </DashboardShellInner>
    </WalletProvider>
  )
}
