'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet, Eye, BarChart2, History, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/wallet',    label: 'Wallet',    icon: Wallet },
  { href: '/watchlist', label: 'Watchlist', icon: Eye },
  { href: '/portfolio', label: 'Portfolio', icon: BarChart2 },
  { href: '/history',   label: 'History',   icon: History },
  { href: '/profile',   label: 'Profile',   icon: User },
]

interface AppSidebarProps {
  nickname?: string
  avatarUrl?: string
}

export function AppSidebar({ nickname = 'Trader', avatarUrl }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-full border-r border-border bg-card">
      {/* User info */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Avatar>
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>{nickname[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm truncate">{nickname}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
