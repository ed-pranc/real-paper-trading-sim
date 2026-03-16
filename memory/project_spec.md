---
name: project_spec
description: Core tech stack, pages, and evaluation criteria for RealPaperTradingSim
type: project
---

RealPaperTradingSim is a stock trading simulator using Twelve Data API + Supabase + Next.js 15 App Router.

**Live URL:** https://rpt-sim.vercel.app
**GitHub:** ed-pranc/real-paper-trading-sim
**Supabase project ID:** mwclbhtzxqanxaysvzkh

**Tech stack:** Next.js 15 (16.x), React 19, shadcn/ui (style: base-nova → upgrading to radix-vega) + Tailwind v4, Supabase (Google Auth), Twelve Data API, Recharts, Vercel

**6 pages:** Wallet, Watchlist, Portfolio, Trade, History, Profile

**3 required charts:**
1. Stock price chart (1D–1Y) — Trade page — `components/trade/stock-chart.tsx`
2. Portfolio value over time (8 periods) — Portfolio page — `components/portfolio/portfolio-chart.tsx`
3. Cumulative P/L over time — History page — `components/history/pnl-chart.tsx`

**Supabase tables:** user_profile, wallet_balance, watchlist, positions, transactions (has pnl column), portfolio_snapshots

**Key rules (from ai-rules/):**
- Always read project-onboarding.md first on every task
- Use shadcn-ui-specialist for all UI tasks
- Delegate to api-specialist for backend
- Run architecture-guardian at end of every task
- Every page MUST use grid grid-cols-12 gap-6 (dashboard-layout.md)
- Sidebar: col-span-12 lg:col-span-3 / Content: col-span-12 lg:col-span-9
- Server actions for all writes, route handlers for API
- Zod validation on all server action inputs and route handler params
- JSDoc on every exported function
- Never expose Twelve Data API key in client code
- Dark theme default, eToro-inspired UI, rounded-full pill buttons
- Auto-refresh every 60s with "Last updated" timestamp

**Evaluation:** 4pts trading simulation, 3pts Supabase, 2pts auto-refresh, 1pt charts+UI, bonus Google Auth
