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

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      {/* Left: trigger + breadcrumb */}
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Centre: simulation date selector */}
      <div className="flex items-center">
        <SimulationDateSelector />
      </div>

      {/* Right: avatar + sign out + theme toggle */}
      <div className="flex flex-1 items-center justify-end gap-1">
        {/* Avatar / profile */}
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
              <span className="text-sm font-medium hidden sm:inline">{nickname}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View profile</TooltipContent>
        </Tooltip>

        {/* Sign out */}
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

        {/* Theme toggle */}
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
      </div>
    </header>
  )
}
