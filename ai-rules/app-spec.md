# RealPaperTradingSim — Application Specification
---
name: app-spec
description: Full product specification for RealPaperTradingSim. Read this on every task to understand the complete intended application.
---

## Overview

**RealPaperTradingSim** is a stock trading simulator that uses real and historical prices from the Twelve Data API.
The user can simulate trading on any past or present date, building a portfolio with virtual money.
All data (wallet, portfolio, transactions, watchlist, snapshots) is persisted in Supabase.

The UI resembles eToro but is built entirely with **shadcn/ui + Tailwind CSS**. Dark theme is primary.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 App Router + React 19 |
| UI | shadcn/ui components + Tailwind CSS |
| Auth + DB | Supabase (Google Auth) |
| Market data | Twelve Data API (quotes + time_series) |
| Charts | Recharts |
| Logic | Server actions + route handlers |
| Deployment | Vercel |

---

## Global Layout

### Left Sidebar (collapsible)
Built with shadcn/ui `NavigationMenu` or `Sidebar`.

- User avatar + nickname (top)
- Wallet
- Watchlist
- Portfolio
- History
- Profile

### Top Header
- **RPTSim** text logo (left)
- **Simulation Date Selector** — always visible, defaults to today; switching date reruns all price/chart fetches (centre)
- Dark/Light theme toggle
- User avatar → links to Profile page

### Every Page Contains
1. **Page section** at top: title + explanation of purpose, features, and benefits
2. **Main content area**
3. **Persistent footer** showing wallet summary (see Wallet section)

---

## Simulation System (Core Feature)

The simulation date is a **global state stored in the header**.

| Behaviour | Detail |
|---|---|
| Default | Current date (live mode) |
| Date selection | User picks any past date/time |
| Price data | All quotes and charts use Twelve Data `time_series` for the selected date |
| Buying / Selling | Executed at the price on the selected simulation date |
| Transaction record | Stored with the simulation date as the transaction date |
| Portfolio valuation | Reflects asset prices at simulation date |
| Return to live | One click resets simulation date to today |
| History display | Always shows the actual stored transaction date |

---

## Persistent Footer (All Pages)

Displayed condensed at the bottom of every page.

| Field | Formula |
|---|---|
| Total Funds Available | Cash not invested |
| Total Invested | Sum of open position cost basis |
| Profit / Loss | Current value of positions − cost basis |
| **Total Value** | **Available + Invested + Profit/Loss** |

---

## Pages

### Wallet

- **Deposit Virtual Funds** button → modal with numeric input → adds amount to Supabase wallet balance
- Displays the four wallet summary fields (same as footer, but full-size cards)
- All values recalculate on deposit, buy, or sell

### Profile

Form fields (saved to Supabase `profiles` table):

- Nickname
- First name
- Last name
- Address line 1
- Address line 2
- City
- Postal code
- Country dropdown (Lithuania only for now)

### Watchlist

- **Add (+)** button → search modal using Twelve Data symbol search
- Each stock row/card shows:
  - Logo (if available), symbol, company name
  - Current (or simulation-date) price
  - 1D change (value + %)
  - Mini price chart for 1D (Recharts or numeric fallback)
  - 52-week range bar
  - Sentiment indicator
  - **Buy** button
- **Buy modal**:
  - Shows price at simulation date
  - User enters number of shares **or** monetary amount (fractional shares allowed)
  - Confirmation step showing total cost
  - On confirm → deducts from wallet, creates position in Portfolio, logs to History
- User can select any past date to view historical data before buying

### Portfolio

- Same card layout as Watchlist but for owned positions only
- Additional columns/fields:
  - Average buy price
  - Current value
  - Unrealised P/L (value + %)
- **Buy more** button (same modal as Watchlist Buy)
- **Sell** button → modal to sell partial or full position at simulation-date price
- **Portfolio value over time** chart at top (Recharts, periods: 1D · 1W · 1M · 6M · 1Y · 2Y · 5Y · All Time)
- Buy and sell both support current price or selected historical date via simulation date

### History

- Table of all transactions: date, symbol, type (buy/sell), quantity, price, total, P/L
- Sortable and filterable by date range
- **P/L performance chart** (Recharts) with custom start and end date selectors
- Cumulative P/L line + individual trade markers

---

## Data Model (Supabase Tables)

| Table | Key Columns |
|---|---|
| `profiles` | id, user_id, nickname, first_name, last_name, address_1, address_2, city, postal_code, country |
| `wallets` | id, user_id, cash_balance |
| `watchlist` | id, user_id, symbol, company_name, added_at |
| `positions` | id, user_id, symbol, quantity, avg_buy_price, opened_at |
| `transactions` | id, user_id, symbol, type (buy/sell), quantity, price, total, simulation_date, created_at |
| `portfolio_snapshots` | id, user_id, total_value, cash, invested, pnl, snapshot_date |

---

## Twelve Data API Usage

| Endpoint | Used For |
|---|---|
| `GET /quote` | Live or latest price for a symbol |
| `GET /time_series` | Historical OHLC for charts and simulation-date pricing |
| `GET /symbol_search` | Watchlist search |
| `GET /logo` | Stock logos in Watchlist / Portfolio |

All Twelve Data calls go through Next.js **route handlers** (`/app/api/market/`) to keep the API key server-side.

---

## Key shadcn/ui Components

`Card` · `Table` · `Dialog` · `Button` · `Input` · `Select` · `NavigationMenu` · `Sidebar` · `DatePicker` · `Badge` · `Separator` · `Avatar` · `DropdownMenu`

---

## Evaluation Criteria (Grading)

| Criterion | Points |
|---|---|
| Correct trading simulation: transactions, positions, P/L, total value | 4 |
| Supabase usage: portfolio, history, snapshots, watchlist | 3 |
| Automatic updates with clear status information | 2 |
| Charts (minimum 3) and clean UI | 1 |
| **Total** | **10** |

---

## Implementation Rules

- Mobile-first responsive: everything stacks on mobile, 12-col Tailwind grid on desktop (3:9 sidebar:content split per `dashboard-layout.md`)
- Server actions for all write operations (trades, deposits, profile updates)
- Never expose Twelve Data API key in client code
- Dark theme default; theme toggle persists to `localStorage`
- Simulation date stored in React context + URL param so it survives navigation
- All monetary values displayed to 2 decimal places with currency symbol ($)
- Fractional share quantities displayed to 6 decimal places maximum
