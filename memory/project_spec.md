---
name: project_spec
description: Core tech stack, pages, and evaluation criteria for RealPaperTradingSim
type: project
---

RealPaperTradingSim is a stock trading simulator using Twelve Data API + Supabase + Next.js 15 App Router.

**Tech stack:** Next.js 15, React 19, shadcn/ui + Tailwind, Supabase (Google Auth), Twelve Data API, Recharts, Vercel

**6 pages:** Wallet, Watchlist, Portfolio, Trade, History, Profile

**3 required charts:**
1. Stock price 1D chart — Trade page
2. Portfolio value over time (8 periods) — Portfolio page
3. Cumulative P/L over time — History page

**Supabase tables:** user_profile, wallet_balance, watchlist, positions, transactions, portfolio_snapshots

**Key rules:**
- Simulation date = global state in SimulationDateProvider (root layout)
- All API calls via Next.js route handlers (`/app/api/market/`) — never expose Twelve Data key
- Server actions for all writes (trades, deposits, profile saves)
- Auto-refresh every 60s with "Last updated" timestamp
- Dark theme default, eToro-inspired UI, rounded-full pill buttons
- Monetary values: 2 decimal places; fractional shares: 6 decimal places

**Evaluation:** 4pts trading simulation, 3pts Supabase, 2pts auto-refresh, 1pt charts+UI, bonus Google Auth

**Why:** This is an academic/evaluation project for a trading simulator course.
**How to apply:** Always consult app-spec.md for full details on any page or feature.
