'use client'

import Link from 'next/link'
import {
  Wallet,
  Eye,
  BarChart2,
  History,
  CalendarClock,
  CheckCircle2,
  Circle,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  ScrollText,
  Clock,
  Search,
  Activity,
  EyeOff,
  Tag,
  ArrowUpDown,
  BookOpen,
  Pencil,
  Trophy,
  ToggleLeft,
  CalendarDays,
  Zap,
  Newspaper,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { LucideIcon } from 'lucide-react'

interface HomeClientProps {
  nickname: string
  hasDeposit: boolean
  watchlistCount: number
  tradeCount: number
  simulationUsed: boolean
}

interface ModuleFeature { icon: LucideIcon; text: string }
interface Module {
  href: string
  icon: LucideIcon
  title: string
  badge: string | null
  intro: string
  features: ModuleFeature[]
  isAnchor?: boolean
}

const MODULES: Module[] = [
  {
    href: '/wallet',
    icon: Wallet,
    title: 'Wallet',
    badge: null,
    intro: 'Your financial command centre.',
    features: [
      { icon: PlusCircle,  text: 'Deposit or withdraw funds at any date — Live or past' },
      { icon: TrendingUp,  text: 'Tracks cash, invested amount, unrealised & realised P/L' },
      { icon: ScrollText,  text: 'Full ledger with running balance and tax position' },
      { icon: Clock,       text: 'Future-dated deposits appear greyed in Simulation mode' },
    ],
  },
  {
    href: '/watchlist',
    icon: Eye,
    title: 'Watchlist',
    badge: null,
    intro: 'Your market radar for stocks and ETFs.',
    features: [
      { icon: Search,       text: 'Search any publicly traded stock or ETF and add to your list' },
      { icon: Activity,     text: 'Live prices, day change, and 52-week high/low at a glance' },
      { icon: CalendarClock,text: 'Jump to a stock\'s first trading day in Simulation mode' },
      { icon: EyeOff,       text: 'Pre-listing dates are automatically greyed out' },
    ],
  },
  {
    href: '/portfolio',
    icon: BarChart2,
    title: 'Portfolio',
    badge: null,
    intro: 'Your open positions, live.',
    features: [
      { icon: TrendingUp,  text: 'Every holding shown with live unrealised P/L' },
      { icon: Tag,         text: 'Average buy price vs current market price per position' },
      { icon: ArrowUpDown, text: 'Sell positions with one click directly from the table' },
    ],
  },
  {
    href: '/history',
    icon: History,
    title: 'History',
    badge: null,
    intro: 'The complete record of every trade you\'ve made.',
    features: [
      { icon: BookOpen,   text: 'Every buy and sell logged with date, price, and P/L' },
      { icon: BarChart2,  text: 'Cumulative P/L chart and monthly performance breakdown' },
      { icon: Trophy,     text: 'Win rate and closed-trade summary across your full history' },
      { icon: Pencil,     text: 'Add a note to any trade via the pencil icon — annotated trades appear in Journal' },
    ],
  },
  {
    href: '/journal',
    icon: BookOpen,
    title: 'Journal',
    badge: 'New',
    intro: 'Your trading diary — the habit that separates disciplined traders from gamblers.',
    features: [
      { icon: Pencil,      text: 'Add optional reasoning notes when placing any trade' },
      { icon: ScrollText,  text: 'Annotated trades appear on a chronological timeline' },
      { icon: Tag,         text: 'Each entry shows the trade, P/L (sells), and your note' },
      { icon: Activity,    text: 'Annotate past trades from History — they appear here instantly' },
    ],
  },
  {
    href: '#simulation',
    icon: CalendarClock,
    title: 'Simulation Mode',
    badge: 'Feature',
    intro: 'Trade the past with real historical prices.',
    features: [
      { icon: ToggleLeft,  text: 'Toggle between Live (today) and Simulation (any past date)' },
      { icon: CalendarDays,text: 'Pick any historical date back to 2000 from a calendar' },
      { icon: Tag,         text: 'All deposits and trades are automatically date-stamped' },
      { icon: Zap,         text: 'Use the LIVE toggle in the header to switch back to today\'s prices' },
      { icon: Newspaper,   text: 'Live news is only available in Live mode — news is hidden during simulation' },
    ],
    isAnchor: true,
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Build your watchlist',
    description: 'Search any publicly traded stock or ETF and add it to your list. Live prices and 52-week ranges update automatically.',
    href: '/watchlist',
  },
  {
    step: '02',
    title: 'Add funds to your wallet',
    description: 'Deposit cash before trading. Use any past date in Simulation mode to seed your portfolio at a historical point in time.',
    href: '/wallet',
  },
  {
    step: '03',
    title: 'Make trades',
    description: 'Buy and sell at today\'s prices in Live mode, or travel back in time with Simulation mode to test strategies at historical prices.',
    href: '/watchlist',
  },
  {
    step: '04',
    title: 'Review & journal',
    description: 'Check Portfolio for open P&L, History for closed trades and performance charts. Add reasoning notes to any trade — annotated trades surface in your Journal timeline.',
    href: '/journal',
  },
]

export function HomeClient({
  nickname,
  hasDeposit,
  watchlistCount,
  tradeCount,
  simulationUsed,
}: HomeClientProps) {
  const checklist = [
    { label: 'Build your watchlist',        done: watchlistCount > 0, href: '/watchlist' },
    { label: 'Add funds to your wallet',    done: hasDeposit,         href: '/wallet' },
    { label: 'Make your first trade',       done: tradeCount > 0,     href: '/watchlist' },
    { label: 'Try Simulation Mode',         done: simulationUsed,     href: '#simulation' },
  ]
  const completedCount = checklist.filter(c => c.done).length
  const progressPct = Math.round((completedCount / checklist.length) * 100)
  const allDone = completedCount === checklist.length

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Hi, {nickname}! 👋
        </h1>
        <p className="text-muted-foreground max-w-xl">
          RPTSim is your virtual trading desk — practice investing with real market data, travel back in time to test strategies, no real money at risk.
        </p>
      </div>

      {/* Getting started checklist — hidden once all items complete */}
      {!allDone && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Getting started</h2>
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
          </div>

          <Separator />
        </>
      )}

      {/* How it works — unified 4-step workflow */}
      <div id="simulation" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500">
            <CalendarClock className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold">How it works</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Four steps to get started — trade at today&apos;s prices or travel back in time with Simulation Mode.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map(({ step, title, description, href }) => (
            <Link key={step} href={href} className="group">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-1.5 h-full hover:border-amber-500/40 transition-colors">
                <span className="text-xs font-mono text-amber-500 font-bold">{step}</span>
                <p className="text-sm font-semibold group-hover:text-amber-500 transition-colors">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Separator />

      {/* Platform modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Platform modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map(({ href, icon: Icon, title, badge, intro, features, isAnchor }) => (
            <Card key={title} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${isAnchor ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </div>
                  {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-4">
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">{intro}</p>
                  <ul className="space-y-1.5">
                    {features.map(({ icon: FIcon, text }) => (
                      <li key={text} className="flex items-start gap-2">
                        <FIcon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isAnchor ? 'text-amber-500' : 'text-primary/60'}`} />
                        <span className="text-xs text-muted-foreground leading-snug">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {!isAnchor && (
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
    </div>
  )
}
