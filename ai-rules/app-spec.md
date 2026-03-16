# RealPaperTradingSim — Application Specification
---
name: app-spec
description: Full product specification for RealPaperTradingSim. Read this on every task to understand the complete intended application.
---

## Overview

**RealPaperTradingSim** is a stock trading simulator that uses real and historical prices from the Twelve Data API.
The user can simulate trading on any past or present date, building a portfolio with virtual money.
All data (wallet, portfolio, transactions, watchlist, snapshots) is persisted in Supabase.
Deployed to Vercel.

The UI resembles eToro but is built entirely with **shadcn/ui + Tailwind CSS**. Dark theme is primary.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router + React 19 |
| UI | shadcn/ui components + Tailwind CSS |
| Auth + DB | Supabase (Google Auth — bonus point) |
| Market data | Twelve Data API (quotes + time_series) |
| Charts | Recharts |
| Logic | Server actions + route handlers |
| Deployment | Vercel |

---

## Global Layout

### Left Sidebar (collapsible)
Built with shadcn/ui `NavigationMenu`.

- User avatar + nickname (top)
- Wallet
- Watchlist
- Portfolio
- **Trade** ← dedicated BUY/SELL page
- History
- Profile

### Top Header (left → right)
1. **RPTSim** text logo
2. Theme toggle (Dark/Light)
3. **Simulation date display + picker** — always visible, defaults to today
4. User avatar → links to Profile page

### Every Page Contains
1. **Explanatory top section**: title + purpose, features, benefits
2. **Main content area**
3. **Persistent footer** (see below)

---

## Persistent Footer (All Pages)

| Field | Formula |
|---|---|
| Total Funds Available | Cash not invested |
| Total Invested | Sum of open position cost basis |
| Profit / Loss | Current value of positions − cost basis |
| **Total Value** | **Available + Invested + Profit/Loss** |

---

## Auto-Refresh (Evaluation: 2 pts)

- All price displays refresh automatically **every 60 seconds**
- Every price display shows **"Last updated: [timestamp]"**
- Charts re-fetch on the same interval
- Visible spinner or indicator during refresh

---

## Simulation System (Core Feature — Evaluation: 4 pts)

The simulation date is **global state in the header**, always visible.

| Behaviour | Detail |
|---|---|
| Default | Current date (live mode) |
| Date selection | User picks any past date |
| Price data | All quotes/charts use Twelve Data `time_series` for selected date |
| Buying / Selling | Executed at price on the selected simulation date |
| Transaction record | Stores both `trade_date` (actual) and `simulation_date` |
| Portfolio valuation | Reflects asset prices at simulation date |
| Return to live | One click resets to today |
| History display | Shows both actual trade date and simulation date |

---

## Required Charts (Evaluation: 1 pt — minimum 3)

| # | Chart | Location |
|---|---|---|
| 1 | Symbol price over time (1D) | Trade page |
| 2 | Portfolio value over time (1D · 1W · 1M · 6M · 1Y · 2Y · 5Y · All) | Portfolio page |
| 3 | P/L over time with date range selector | History page |

---

## Pages

### Wallet
- **Deposit Virtual Funds** button → modal with numeric input → adds to Supabase balance
- Displays four summary cards: Available, Invested, P/L, Total Value
- Recalculates on every deposit, buy, and sell

### Profile
Form saved to `user_profile` table:
- Nickname, First name, Last name
- Address line 1, Address line 2, City, Postal code
- Country dropdown (Lithuania only for now)

### Watchlist
- **Add (+)** button → search modal using Twelve Data symbol search
- Each row shows: symbol, company name, current/historical price, 1D change, mini 1D chart, 52-week range, **Buy** button
- Buy button opens Trade modal at that symbol
- Prices auto-refresh every 60 s with "Last updated" label

### Trade *(core BUY/SELL view — one of the required 3 views)*
- Symbol search or arrival from Watchlist
- Displays current price + 1D price chart (Chart #1)
- Shows simulation date price when sim mode active
- **Buy or Sell**: enter share quantity **or** monetary amount (fractional shares supported)
- Confirmation step shows exact price, quantity, total cost at simulation date
- Auto-refreshes with "Last updated" timestamp
- On confirm: deducts/credits wallet, updates position, logs to `transactions`

### Portfolio *(core view — one of the required 3 views)*
- Owned positions: symbol, quantity, avg buy price, current value, unrealised P/L (value + %)
- **Portfolio value over time** chart (Chart #2) — periods: 1D · 1W · 1M · 6M · 1Y · 2Y · 5Y · All
- **Sell** button and **Buy more** button per position
- Prices auto-refresh every 60 s with "Last updated" label

### History *(core Stats view — one of the required 3 views)*
- Full transaction table: trade date, simulation date, type (buy/sell), symbol, quantity, price, total, P/L
- Sortable, filterable by date range
- **P/L over time** chart (Chart #3) with custom start and end date selectors

---

## Data Model (Supabase Tables — Evaluation: 3 pts)

| Table | Key Columns |
|---|---|
| `user_profile` | id, user_id, nickname, first_name, last_name, address_1, address_2, city, postal_code, country |
| `wallet_balance` | id, user_id, cash_balance |
| `watchlist` | id, user_id, symbol, company_name, added_at |
| `positions` | id, user_id, symbol, quantity, avg_buy_price, opened_at |
| `transactions` | id, user_id, symbol, type (buy/sell), quantity, price, total, trade_date, simulation_date |
| `portfolio_snapshots` | id, user_id, total_value, cash, invested, pnl, snapshot_date |

---

## Twelve Data API Usage

| Endpoint | Used For |
|---|---|
| `GET /quote` | Live or latest price for a symbol |
| `GET /time_series` | Historical OHLC for charts and simulation-date pricing |
| `GET /symbol_search` | Watchlist and Trade search |
| `GET /logo` | Stock logos in Watchlist / Portfolio |

All calls go through Next.js **route handlers** (`/app/api/market/`) — API key never exposed to client.

---

## Key shadcn/ui Components

`Card` · `Table` · `Dialog` · `Button` · `Input` · `Select` · `NavigationMenu` · `Badge` · `Separator` · `Avatar` · `DropdownMenu` · `Sheet`

---

## Evaluation Criteria

| Criterion | Points | How Met |
|---|---|---|
| Correct trading simulation: transactions, positions, P/L, total value | 4 | Simulation date system + Trade page + Portfolio |
| Supabase usage: portfolio, history, snapshots, watchlist | 3 | All 6 tables above |
| Automatic updates with clear status information | 2 | 60 s auto-refresh + "Last updated" on every price display |
| Charts (minimum 3) and clean UI | 1 | 3 named charts above |
| Google Auth | bonus | Supabase Google provider |
| **Total** | **10+** | |

---

## UI Design Reference (from eToro screenshots)

### Layout & Colours
- Sidebar: very narrow (~65 px), icon-only when collapsed, dark navy (`bg-[#1a1f2e]` or `bg-card` in dark theme)
- Main content area: **light grey background** (`bg-muted/40`), NOT full dark — white cards sit on grey
- White cards (`bg-card`) with subtle border and shadow on the grey page background
- Green `#22c55e` for positive values, Buy buttons, progress bars
- Red `#ef4444` for negative values, Sell/Close buttons
- All action buttons are **rounded-full pill style** (not rounded-md)

### Sidebar
- Collapsed by default (icon only), expands on hover or toggle
- Very dark, minimal — only icons visible in collapsed state
- Active page: green left border accent or highlighted icon

### Header (top bar)
- Centred **Search bar** (prominent, not just a small input)
- Right side: notification bell, user actions
- Simulation date selector fits where the search bar is (our addition)

### Watchlist rows
- Columns: logo + symbol + company name | Change 1D (value\n%) | mini sparkline | Sell price (red pill) | Buy price (green/light pill) | 52W Range (min — rangebar — max) | ⋮ menu
- Sparklines are small inline Recharts `<LineChart>` ~80×32px, no axes
- 52W range: two numbers with a thin progress bar between them, indicator dot for current price
- Positive change = green text; negative = red text
- Row hover shows subtle background

### Portfolio rows
- Columns: logo + symbol + name + badge | Price (value\nchange%) | Units\nLong | Avg. Open | P/L ($) | Close button (red pill) | Trade button (green pill) | ⋮ menu
- P/L green if positive, red if negative
- "Long" badge next to units (grey/muted)
- ⋮ context menu: Asset detail, Close, Open New Trade, View Chart

### Trade / Stock detail page
- Stock header: large logo, symbol bold, company name muted, price large bold, change (green/red), green Trade pill button
- Tab bar: Overview · Chart · Analysis (we skip Analysis/News/Financials)
- Left ~60% wide: Performance chart with period selector pills (1D 1W 1M 6M 1Y 3Y MAX)
- Right ~40%: "My investment" card (Market Value, Units, Avg Price, Today's Return) + stats

### Buy modal
- Short / Buy toggle at top (we only implement Buy and Sell, no shorting)
- Large Amount input with $ prefix
- Live calculation below: "X Exposure | Y Shares" updates as user types
- Stock info row at bottom showing current price + change
- "Available USD: $X" line above the big Buy button
- Big full-width green "Buy" pill button at bottom

### Wallet page
- Hero section: "Your Total Value" label, giant `$100,000.00`, "Last update at HH:MM DD/MM/YYYY"
- Green full-width progress bar below the amount
- "100% Investment Account" allocation label
- Outlined pill action buttons (Add Funds, Move Funds) with icons
- Investment Account card: shows Available USD balance

### History page
- Summary stats bar at top: date range | Start Value | Money In | Money Out | P/L($)(%) | End Value
- Table columns: Action (icon + label) | Invested | Units | Open | Open Time | Close | Close Time
- Period filter top right: WTD / MTD / custom
- Grouped rows: Net Cashflows, Dividends, Total Fees (with coin-stack icon)

### Price display patterns
- Change shows as two lines: `4.57` on top, `(2.54%)` below — both green or red
- "Last update at HH:MM, DD/MM/YYYY" format for auto-refresh timestamp (visible on Wallet)
- All prices 2 decimal places, currency symbol prefix

---

## Implementation Rules

- Mobile-first responsive: 12-col Tailwind grid, 3:9 sidebar:content split on desktop (per `dashboard-layout.md`)
- Server actions for all writes (trades, deposits, profile saves)
- Never expose Twelve Data API key in client code
- Dark theme default; theme toggle persists via `next-themes`
- Simulation date stored in React context (see `context/simulation-date.tsx`)
- Monetary values: 2 decimal places with currency symbol
- Fractional share quantities: up to 6 decimal places
- Both `trade_date` and `simulation_date` recorded on every transaction
