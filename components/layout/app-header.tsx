'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SimulationDateSelector } from '@/components/simulation/simulation-date-selector'
import { useEffect, useState } from 'react'

interface AppHeaderProps {
  onMenuToggle?: () => void
  nickname?: string
  avatarUrl?: string
}

export function AppHeader({ onMenuToggle, nickname = 'Trader', avatarUrl }: AppHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  return (
    <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-card shrink-0">
      {/* Left: hamburger (mobile) + logo */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/wallet" className="font-bold text-lg tracking-tight">
          RPTSim
        </Link>
      </div>

      {/* Centre: simulation date selector */}
      <SimulationDateSelector />

      {/* Right: theme toggle + avatar */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {mounted && (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
        </Button>
        <Link href="/profile">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{nickname[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
