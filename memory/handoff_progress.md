---
name: handoff_progress
description: Build progress: what works, what still needs building, key files, known issues
type: project
---

## Status as of 2026-03-16

### Deployed ✅
- Live at: https://rpt-sim.vercel.app
- GitHub: ed-pranc/real-paper-trading-sim (main branch → Vercel auto-deploy)
- Supabase project: mwclbhtzxqanxaysvzkh
- Google Auth working end-to-end (Supabase Site URL + Redirect URLs set, Google OAuth redirect URI set)

### All 6 pages complete and working ✅
- **Wallet** — deposit modal, 4 summary cards
- **Watchlist** — eToro-style rows, sparklines, 52W range, search modal, auto-refresh
- **Portfolio** — position rows with live P/L, PortfolioChart (Chart #2, 8 periods), Buy/Close buttons
- **Trade** — symbol search dropdown, StockChart (Chart #1, 5 periods), BuySellModal
- **History** — transaction table (sortable/filterable), PnLChart (Chart #3), summary cards
- **Profile** — full form, saveProfile server action, upserts user_profile

### Infrastructure complete ✅
- SimulationDateProvider (root) + SimulationDateSelector in header
- WalletProvider: real P/L via live/sim-date price fetches, auto-refresh every 60s
- Server actions: executeBuy, executeSell (stores pnl), depositFunds, saveProfile
- API routes: /api/market/quote, /api/market/timeseries, /api/market/search
- Auth: /login, /auth/callback, dashboard layout guards
- vercel.json: framework = nextjs (fixes Nuxt output dir conflict)

---

## Planned Refactoring (next session)

### 1. Apply shadcn Vega theme (preset aKFU8KA)
Run: `pnpm dlx shadcn@latest init --preset aKFU8KA --template next --monorepo`
Then apply diffs to:
- `components.json` → style: radix-vega, iconLibrary: hugeicons, menuColor: default-translucent
- `globals.css` → olive base + emerald primary CSS variables, --radius: 0.45rem, --font-mono
- `app/layout.tsx` → rename font vars to --font-sans/--font-mono, add font-mono class to <html>
- Install: `pnpm add @hugeicons/react`
- No tailwind.config.ts (Tailwind v4, CSS-based config)

### 2. Fix dashboard layout (ai-rules/dashboard-layout.md violation)
Every page MUST use `grid grid-cols-12 gap-6` with col-span-12 lg:col-span-3 / lg:col-span-9 split.
Pages to fix: Trade, History, Profile (currently use space-y-6 flat layout).
Wallet, Watchlist, Portfolio may also need grid wrapper audit.

### 3. Add Zod validation (ai-rules/security-practices.md + api-specialist.md)
- `lib/actions/trade.ts` — validate symbol, quantity, price inputs
- `lib/actions/wallet.ts` — validate deposit amount
- `lib/actions/profile.ts` — validate all profile fields
- `/api/market/*` route handlers — validate query params

### 4. Add JSDoc (ai-rules/best-coding-practices.md)
Every exported function needs JSDoc with @param and @returns.
Priority: all server actions and API route handlers.

### 5. Run architecture-guardian checks
After refactor: pnpm audit, pnpm run build, pnpm run lint, pnpm run type-check

---

## Key files reference
- `context/simulation-date.tsx` — global sim date state
- `context/wallet.tsx` — global wallet summary, refreshes every 60s + on sim date change
- `components/layout/app-sidebar.tsx` — nav (all 6 links)
- `components/layout/wallet-footer.tsx` — persistent P/L footer
- `components/trade/buy-sell-modal.tsx` — shared modal (Watchlist, Portfolio, Trade)
- `components/trade/stock-chart.tsx` — Chart #1 (single symbol)
- `components/portfolio/portfolio-chart.tsx` — Chart #2 (portfolio value over time)
- `components/history/pnl-chart.tsx` — Chart #3 (cumulative realised P/L)
- `lib/actions/trade.ts` — executeBuy, executeSell
- `lib/actions/wallet.ts` — depositFunds
- `lib/actions/profile.ts` — saveProfile
- `lib/twelvedata/client.ts` — Twelve Data API helpers

## Known issues / notes
- `pnl` column added to Supabase `transactions` table manually (numeric, nullable)
- Twelve Data free tier: 8 req/min — heavy sim date changes may hit rate limit
- WalletProvider fetches 1 price per open position on every 60s refresh
- HugeIcons not yet installed (still using lucide-react everywhere)
- dashboard-layout.md 12-col grid NOT yet applied to Trade, History, Profile pages
- No Zod validation on server actions yet
- No JSDoc on exported functions yet
