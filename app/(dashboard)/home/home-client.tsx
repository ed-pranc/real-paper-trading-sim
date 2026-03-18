'use client'

import Link from 'next/link'
import {
  Wallet,
  Eye,
  BarChart2,
  History,
  CalendarClock,
  User,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface HomeClientProps {
  nickname: string
  profileComplete: boolean
  watchlistCount: number
  tradeCount: number
  simulationUsed: boolean
}

const MODULES = [
  {
    href: '/wallet',
    icon: Wallet,
    title: 'Wallet',
    badge: null,
    description:
      'Your financial foundation. Deposit virtual funds to get started — your wallet tracks your available cash, total invested amount, and real-time portfolio value at a glance.',
  },
  {
    href: '/watchlist',
    icon: Eye,
    title: 'Watchlist',
    badge: null,
    description:
      'Your market radar. Search for any publicly traded stock and add it to your personal watchlist. Monitor live prices, track 52-week ranges, and jump straight into a trade from here.',
  },
  {
    href: '/portfolio',
    icon: BarChart2,
    title: 'Portfolio',
    badge: null,
    description:
      'Your active positions. Every stock you buy appears here with live P&L tracking. See exactly how each holding is performing and manage positions with one click.',
  },
  {
    href: '/history',
    icon: History,
    title: 'History',
    badge: null,
    description:
      'The full story. Every buy and sell is recorded. Analyse your cumulative P&L, explore monthly returns, and review your win rate across all closed trades.',
  },
  {
    href: '#simulation',
    icon: CalendarClock,
    title: 'Simulation Mode',
    badge: 'Feature',
    description:
      'Trade the past. Pick any historical date and the platform locks all prices to that moment. Buy and sell as if you were there — then advance the date to see how your decisions played out.',
  },
]

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Set up your Profile',
    description: 'Add a nickname so the platform feels personal.',
    href: '/profile',
  },
  {
    step: '02',
    title: 'Fund your Wallet',
    description: 'Deposit any amount of virtual cash to begin trading.',
    href: '/wallet',
  },
  {
    step: '03',
    title: 'Build a Watchlist',
    description: 'Search and add the stocks you want to follow.',
    href: '/watchlist',
  },
  {
    step: '04',
    title: 'Make your first trade',
    description: 'Hit Buy on any watchlist item to open a position.',
    href: '/watchlist',
  },
  {
    step: '05',
    title: 'Review your results',
    description: 'Check Portfolio for live P&L and History for all trades.',
    href: '/history',
  },
]

export function HomeClient({
  nickname,
  profileComplete,
  watchlistCount,
  tradeCount,
  simulationUsed,
}: HomeClientProps) {
  const checklist = [
    { label: 'Complete your profile', done: profileComplete, href: '/profile' },
    { label: 'Add stocks to your watchlist', done: watchlistCount > 0, href: '/watchlist' },
    { label: 'Make your first trade', done: tradeCount > 0, href: '/watchlist' },
    { label: 'Try simulation mode', done: simulationUsed, href: '#simulation-hint' },
  ]
  const completedCount = checklist.filter(c => c.done).length
  const progressPct = Math.round((completedCount / checklist.length) * 100)
  const allDone = completedCount === checklist.length

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {nickname} 👋
        </h1>
        <p className="text-muted-foreground max-w-xl">
          RPTSim is your virtual trading desk — practice investing with real market data, no real money at risk.
        </p>
      </div>

      {/* Platform modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Platform modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(({ href, icon: Icon, title, badge, description }) => (
            <Card key={title} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </div>
                  {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-4">
                <CardDescription className="text-sm leading-relaxed flex-1">
                  {description}
                </CardDescription>
                {href !== '#simulation' && (
                  <Button variant="ghost" size="sm" className="self-start -ml-2 text-primary" asChild>
                    <Link href={href}>
                      Go to {title} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {WORKFLOW_STEPS.map(({ step, title, description, href }, i) => (
            <div key={step} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 lg:flex-col lg:items-start">
                <span className="text-xs font-mono text-primary font-bold">{step}</span>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className="hidden lg:block h-px flex-1 bg-border mt-0.5" />
                )}
              </div>
              <Link href={href} className="group">
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Get started checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {allDone ? '🎉 All set!' : 'Get started'}
          </h2>
          <span className="text-sm text-muted-foreground">
            {completedCount} / {checklist.length} complete
          </span>
        </div>

        <Progress value={progressPct} className="h-2" />

        <div className="grid gap-2">
          {checklist.map(({ label, done, href }) => (
            <Link
              key={label}
              href={done ? '#' : href}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                done
                  ? 'border-green-600/20 bg-green-600/5 cursor-default'
                  : 'border-border hover:bg-accent/50 cursor-pointer'
              }`}
            >
              {done
                ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              }
              <span className={`text-sm ${done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                {label}
              </span>
              {!done && <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
            </Link>
          ))}
        </div>

        {!simulationUsed && (
          <p id="simulation-hint" className="text-xs text-muted-foreground">
            💡 <strong>Simulation mode:</strong> Toggle the LIVE / SIMULATION switch in the top bar and pick a historical date to trade the past.
          </p>
        )}
      </div>
    </div>
  )
}
