---
name: handoff_progress
description: Build progress: what works, what still needs building, key files, known issues
type: project
---

## Status as of 2026-03-16

### Completed ✅
- Global layout: AppHeader, AppSidebar (all 6 nav items wired), WalletFooter
- SimulationDateProvider (root) + SimulationDateSelector in header — fully wired
- WalletProvider in DashboardShell — now includes real P/L via live price fetches + sim date awareness
- Auth: Supabase Google Auth, /login page, /auth/callback route
- **Wallet page** — deposit modal, 4 summary cards, DepositModal (server action)
- **Watchlist page** — full eToro-style rows with sparklines, 52W range bar, Buy button, search modal, auto-refresh
- **Portfolio page** — position rows with P/L, Buy/Close buttons, PortfolioChart (8 time periods)
- **Trade page** — symbol search dropdown, price display, StockChart (5 periods, Chart #1), Buy/Sell buttons, BuySellModal
- **History page** — summary cards, PnLChart (Chart #3, cumulative realised P/L), sortable/filterable transaction table
- **Profile page** — ProfileForm with all fields, server action saveProfile, upserts user_profile
- BuySellModal — buy/sell toggle, amount/shares input mode, fractional shares, sim date label, wallet balance check
- Server actions: depositFunds, executeBuy, executeSell (stores pnl on sell), saveProfile
- API routes: /api/market/quote, /api/market/timeseries, /api/market/search

### Still TODO / Nice-to-have
- portfolio_snapshots table: not yet written to anywhere (could add a snapshot after each trade)
- Wallet page client component (wallet-client.tsx exists but may need wiring check)
- Google Auth setup in Supabase dashboard (requires env config, not code)
- Vercel deployment (env vars needed: TWELVE_DATA_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

### Key files
- `context/simulation-date.tsx` — global sim date state
- `context/wallet.tsx` — global wallet summary (cash, invested, pnl, total) — refreshes every 60s + on sim date change
- `components/layout/app-sidebar.tsx` — nav links
- `components/layout/wallet-footer.tsx` — persistent footer bar
- `components/trade/buy-sell-modal.tsx` — shared buy/sell modal used by Watchlist, Portfolio, Trade pages
- `components/trade/stock-chart.tsx` — 1D/1W/1M/6M/1Y chart for a single symbol (Chart #1)
- `components/portfolio/portfolio-chart.tsx` — portfolio value over time (Chart #2)
- `components/history/pnl-chart.tsx` — cumulative realised P/L chart (Chart #3)
- `lib/actions/trade.ts` — executeBuy, executeSell
- `lib/actions/wallet.ts` — depositFunds
- `lib/actions/profile.ts` — saveProfile
- `lib/twelvedata/client.ts` — Twelve Data API helpers

### Known issues / notes
- `pnl` column must exist in the `transactions` Supabase table for History P/L to work
- Twelve Data free tier: 8 requests/minute — heavy simulation date changes may hit rate limit
- WalletProvider now fetches prices for each position on every 60s refresh (n API calls)
