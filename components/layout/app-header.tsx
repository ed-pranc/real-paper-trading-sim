'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SimulationDateSelector } from '@/components/simulation/simulation-date-selector'
import { signOut } from '@/lib/actions/auth'
import { useEffect, useState } from 'react'

const PAGE_LABELS: Record<string, string> = {
  '/home':      'Quick Start',
  '/wallet':    'Wallet',
  '/watchlist': 'Watchlist',
  '/portfolio': 'Portfolio',
  '/history':   'History',
  '/journal':   'Journal',
  '/specs':     'Specs',
}

interface AppHeaderProps {
  nickname: string
  onOpenProfile: () => void
}

export function AppHeader({ nickname, onOpenProfile }: AppHeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setMounted(true), [])

  const pageLabel = PAGE_LABELS[pathname] ?? 'RPTSim'

  const userActions = (showName: boolean) => (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-2"
          >
            <Avatar className="h-7 w-7 rounded-lg">
              <AvatarFallback className="rounded-lg text-xs">
                {nickname[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {showName && <span className="text-sm font-medium">{nickname}</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>View profile</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <form action={signOut}>
            <Button variant="ghost" size="icon" type="submit" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </TooltipTrigger>
        <TooltipContent>Sign out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {mounted && (theme === 'dark'
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>
    </>
  )

  const navRow = (
    <>
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </>
  )

  return (
    <header className="shrink-0 border-b border-border bg-background">
      {/* Desktop: single row */}
      <div className="hidden sm:flex h-14 items-center gap-2 px-4">
        <div className="flex flex-1 items-center gap-2">{navRow}</div>
        <div className="flex items-center"><SimulationDateSelector /></div>
        <div className="flex flex-1 items-center justify-end gap-1">{userActions(true)}</div>
      </div>

      {/* Mobile: 3 rows */}
      <div className="sm:hidden">
        {/* Row 1: nav */}
        <div className="flex h-11 items-center gap-2 px-4">{navRow}</div>
        {/* Row 2: LIVE / SIM toggle */}
        <div className="flex items-center justify-center px-4 py-1.5 border-t border-border/50">
          <SimulationDateSelector />
        </div>
        {/* Row 3: user actions */}
        <div className="flex items-center justify-end gap-1 px-4 pb-2 pt-1">
          {userActions(true)}
        </div>
      </div>
    </header>
  )
}
