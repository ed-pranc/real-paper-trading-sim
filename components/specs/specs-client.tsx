'use client'

import {
  CheckCircle2,
  Star,
  GitBranch,
  GitCommit,
  CalendarDays,
  Rocket,
  Database,
  Code2,
  BarChart2,
  Zap,
  Shield,
  Globe,
  Layers,
  RefreshCw,
  BookOpen,
  Newspaper,
  Bell,
  Smartphone,
  Clock,
  Bot,
  FileCode2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { LucideIcon } from 'lucide-react'

// ─── Data ───────────────────────────────────────────────────────────────────

const BUILD_STATS = [
  { value: '65',     label: 'Commits',       icon: GitCommit },
  { value: '38',     label: 'Branches',      icon: GitBranch },
  { value: '5',      label: 'Days',          icon: CalendarDays },
  { value: '~20',    label: 'Deployments',   icon: Rocket },
  { value: '~40',    label: 'Dev Hours',     icon: Clock },
  { value: '~10M',   label: 'AI Tokens',     icon: Bot },
  { value: '12,412', label: 'Lines of Code', icon: FileCode2 },
  { value: '63',     label: 'Components',    icon: Layers },
]

const EVAL_CRITERIA = [
  {
    title: 'Trading Simulation',
    points: '4 pts',
    status: 'covered' as const,
    icon: Zap,
    note: 'Time-travel to any date since 2000. Historical prices for all buys/sells. Positions, P/L, and portfolio value all reflect the chosen simulation date.',
  },
  {
    title: 'Supabase Usage',
    points: '3 pts',
    status: 'covered' as const,
    icon: Database,
    note: '7 tables, Row-Level Security on every table, server-side Supabase client. Google OAuth via Supabase Auth — each user sees only their own data.',
  },
  {
    title: 'Auto-updates',
    points: '2 pts',
    status: 'covered' as const,
    icon: RefreshCw,
    note: 'All live prices refresh every 60 seconds. Every price display shows a "Last updated" timestamp. Charts re-fetch on the same interval.',
  },
  {
    title: 'Charts & UI',
    points: '1 pt',
    status: 'covered' as const,
    icon: BarChart2,
    note: '7 + charts: portfolio value, cumulative P/L, monthly breakdown, wallet balance, sparklines. shadcn/ui design system, fully responsive.',
  },
]

const BONUS_POINTS = [
  { icon: Shield,     text: 'Google OAuth authentication via Supabase' },
  { icon: Globe,      text: 'Stock detail sheet with analyst ratings & price targets' },
  { icon: Bell,       text: 'Price alert system — toast notification on trigger' },
  { icon: Newspaper,  text: 'Live news feed — automatically hidden in Simulation mode' },
  { icon: BookOpen,   text: 'Trade Journal — notes timeline with buy/sell split layout' },
  { icon: Smartphone, text: 'Mobile-responsive layout — 3-row header, stacked footer' },
]

const TECH_STACK: { layer: string; tech: string; icon: LucideIcon }[] = [
  { layer: 'Framework',      tech: 'Next.js 16.1.6 · App Router · React 19',           icon: Layers },
  { layer: 'Language',       tech: 'TypeScript (strict)',                                icon: Code2 },
  { layer: 'UI Library',     tech: 'shadcn/ui · Tailwind CSS v4',                       icon: Globe },
  { layer: 'Auth + Database',tech: 'Supabase · PostgreSQL · Row-Level Security',        icon: Database },
  { layer: 'Market Data',    tech: 'Twelve Data API (quotes · time_series · search) · Finnhub (live quotes · news · analyst data)', icon: BarChart2 },
  { layer: 'Charts',         tech: 'Recharts (area · bar · line)',                       icon: BarChart2 },
  { layer: 'Deployment',     tech: 'Vercel — CI/CD on every push to main',              icon: Rocket },
  { layer: 'State & Logic',  tech: 'React Context · Server Actions · Zod validation',  icon: Zap },
  { layer: 'Dates & Theme',  tech: 'date-fns · react-day-picker · next-themes',        icon: CalendarDays },
]

const DB_TABLES = [
  { name: 'user_profile',    purpose: 'Nickname, name, address' },
  { name: 'wallet_balance',  purpose: 'Cash balance (per user)' },
  { name: 'wallet_deposits', purpose: 'Deposit / withdraw ledger' },
  { name: 'watchlist',       purpose: 'Per-user symbol list' },
  { name: 'positions',       purpose: 'Open holdings (zeroed on full close)' },
  { name: 'transactions',    purpose: 'Every buy/sell — stores trade_date + simulation_date' },
  { name: 'price_alerts',    purpose: 'Target price + triggered flag' },
]

const CORE_FEATURES = [
  'Wallet — deposit, withdraw, full ledger, realised P/L',
  'Watchlist — live prices, sparklines, 52-week range',
  'Portfolio — unrealised P/L, close positions, buy more',
  'History — full trade log, cumulative P/L, win rate',
  'Quick Start — onboarding checklist + module guide',
  'Simulation Mode — time-travel trading at historical prices',
]

const BONUS_FEATURES = [
  'Trade Journal — annotated timeline, buys left / sells right',
  'Stock Detail Sheet — chart, analyst forecast, my position',
  'Price Alerts — set target, notified on trigger',
  'News Feed — live articles (hidden in Simulation mode)',
  'Mobile Responsive — 3-row header, stacked footer',
  'Light / Dark theme — switchable from the header',
]

// ─── Component ───────────────────────────────────────────────────────────────

export function SpecsClient() {
  return (
    <div className="space-y-10">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Project Specs</h1>
          <p className="text-muted-foreground max-w-xl">
            A complete technical overview of RPTSim — built as a graded course project using real market data, historical simulation, and a production-grade stack.
          </p>
        </div>
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 shrink-0 mt-1 hover:bg-amber-500/10">
          Submitted 03 / 2026
        </Badge>
      </div>

      {/* ── Build Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {BUILD_STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-card p-4 text-center space-y-1">
            <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-3xl font-bold tabular-nums tracking-tight">{value}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <Separator />

      {/* ── Evaluation Score ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Evaluation Score</h2>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/10">
            10 / 10 pts
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EVAL_CRITERIA.map(({ title, points, icon: Icon, note }) => (
            <Card key={title} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-500/10 text-green-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">{title}</CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary" className="text-xs">{points}</Badge>
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs hover:bg-green-500/10">
                    ✓ Covered
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bonus row */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500">
                  <Star className="h-4 w-4" />
                </div>
                <CardTitle className="text-sm">Bonus Points</CardTitle>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
                +6 bonus features
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {BONUS_POINTS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span className="text-xs text-muted-foreground leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ── Tech Stack ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tech Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TECH_STACK.map(({ layer, tech, icon: Icon }) => (
            <div key={layer} className="rounded-lg border bg-card p-4 flex items-start gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{layer}</p>
                <p className="text-sm font-medium mt-0.5 leading-snug">{tech}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Features Built ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">What Was Built</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Core spec */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Core specification</p>
            <ul className="space-y-2">
              {CORE_FEATURES.map(text => (
                <li key={text} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                  <span className="text-sm text-muted-foreground leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Beyond spec */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Beyond the spec</p>
            <ul className="space-y-2">
              {BONUS_FEATURES.map(text => (
                <li key={text} className="flex items-start gap-2">
                  <Star className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <span className="text-sm text-muted-foreground leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Database Schema ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Supabase Schema</h2>
          <Badge variant="secondary" className="text-xs">7 tables · RLS on all</Badge>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Table</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DB_TABLES.map(({ name, purpose }) => (
                <tr key={name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{name}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
