---
name: refactor_plan
description: Ordered refactoring plan for next session — shadcn theme, 12-col grid, Zod, JSDoc
type: project
---

## Refactoring Plan (ready to execute)

Execute in this order to avoid conflicts:

### Step 1 — Apply shadcn Vega theme
**Why:** components.json still says base-nova/lucide; theme CSS vars are plain black/white neutral.
**How to apply:** Run preset command first, then apply diffs below.

Preset command (in project root):
```
pnpm dlx shadcn@latest init --preset aKFU8KA --template next --monorepo
```
WARNING: Run in temp dir first to diff — do NOT overwrite existing app files automatically.

Manual diffs needed after:

**components.json** — 3 field changes:
- style: "base-nova" → "radix-vega"
- iconLibrary: "lucide" → "hugeicons"
- menuColor: "default" → "default-translucent"
- Remove "registries": {}

**globals.css** — replace :root, .dark, @theme inline blocks:
- Olive base: foreground hue ~107, low chroma
- Emerald primary: hue ~165, chroma ~0.12–0.17
- --radius: 0.45rem (small)
- @theme inline: --font-mono: var(--font-mono), remove --font-sans
- @layer base: remove html { @apply font-sans }
- Full CSS vars are in memory from probe: /tmp/shadcn-probe/shadcn-probe/packages/ui/src/styles/globals.css

**app/layout.tsx** — 3 changes:
- Geist variable: '--font-geist-sans' → '--font-sans'
- Geist_Mono variable: '--font-geist-mono' → '--font-mono'
- Move font classes + add font-mono to <html>, remove from <body>

**Install:** `pnpm add @hugeicons/react`

---

### Step 2 — Fix 12-column grid layout (dashboard-layout.md)
**Why:** Trade, History, Profile pages use flat space-y-6. Rule requires grid grid-cols-12 gap-6.

Wrap each page's content in:
```tsx
<div className="grid grid-cols-12 gap-6">
  {/* sidebar/controls */}
  <div className="col-span-12 lg:col-span-3">...</div>
  {/* main content */}
  <div className="col-span-12 lg:col-span-9">...</div>
</div>
```

Pages to fix:
- app/(dashboard)/trade/trade-client.tsx — search panel left, chart+modal right
- app/(dashboard)/history — filters+summary left, table+chart right
- components/profile/profile-form.tsx — info left, form right
- Audit: wallet-client.tsx, watchlist-client.tsx, portfolio-client.tsx

---

### Step 3 — Zod validation
**Why:** security-practices.md + api-specialist.md require Zod on all inputs.

Install: `pnpm add zod` (if not already present)

Files to update:
- lib/actions/trade.ts — z.object({ symbol: z.string().min(1), quantity: z.number().positive(), price: z.number().positive(), simulationDate: z.string().nullable() })
- lib/actions/wallet.ts — z.number().positive().max(1_000_000)
- lib/actions/profile.ts — z.object with string fields, max lengths
- app/api/market/quote/route.ts — z.string().min(1) for symbol param
- app/api/market/timeseries/route.ts — validate symbol, interval, outputsize
- app/api/market/search/route.ts — validate q param

---

### Step 4 — JSDoc
**Why:** best-coding-practices.md requires JSDoc on every exported function.

Add to all exported functions in:
- lib/actions/*.ts (executeBuy, executeSell, depositFunds, saveProfile, watchlist actions)
- lib/twelvedata/client.ts (tdFetch, getQuote, getTimeSeries, searchSymbol)
- context/wallet.tsx (WalletProvider, useWallet)
- context/simulation-date.tsx (SimulationDateProvider, useSimulationDate, useActiveDate)

---

### Step 5 — Architecture guardian run
```
pnpm audit
pnpm run build
pnpm run lint
pnpm run type-check
```
Fix any failures before pushing.

---

### Step 6 — Commit and push
```
git add -A
git commit -m "refactor: apply Vega theme, 12-col grid, Zod validation, JSDoc"
git push
```
