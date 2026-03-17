# Naming Conventions — Financial Metrics

## Source of Truth

All metric display labels are defined in `lib/labels.ts`.
**Never hardcode these strings in components.** Import from `LABELS` instead:

```ts
import { LABELS } from '@/lib/labels'
```

---

## Canonical Metric Names

| Key | Display Label | Meaning |
|-----|--------------|---------|
| `LABELS.cash` | **Available Cash** | Uninvested cash balance ready to deploy |
| `LABELS.invested` | **Total Invested** | Cost basis of all open positions |
| `LABELS.unrealisedPnl` | **Unrealised P/L** | Mark-to-market gain/loss on open positions |
| `LABELS.realisedPnl` | **Realised P/L** | Actual profit/loss from completed (sell) trades |
| `LABELS.totalValue` | **Total Value** | Cash + Total Invested + Unrealised P/L |

---

## Rationale

- **Available Cash** (not "Available") — "Available" alone is ambiguous; "Cash" clarifies the asset type.
- **Total Invested** (not "Invested") — "Total" makes clear this is the aggregate cost basis, not a single position.
- **Unrealised P/L** (not "Profit / Loss") — Explicitly distinguishes from realised P/L; prevents confusion when both are shown.
- **Realised P/L** (not "Realised Profit") — Consistent parallel structure with "Unrealised P/L".
- **Total Value** (not "Equity") — More accessible to non-finance users; consistent with Portfolio page usage.

---

## Where Each Metric Appears

| Metric | Footer (LIVE) | Footer (SIM) | Wallet Page | Portfolio Page | History Page |
|--------|:---:|:---:|:---:|:---:|:---:|
| Available Cash | ✓ | ✓ | ✓ | — | — |
| Total Invested | ✓ | ✓ | ✓ | ✓ | — |
| Unrealised P/L | ✓ | ✓ | ✓ | ✓ | — |
| Realised P/L | — | ✓ | — | — | ✓ |
| Total Value | ✓ | ✓ | ✓ | ✓ | — |

---

## Adding New Metrics

If a new financial metric is introduced:
1. Add it to `lib/labels.ts` with a camelCase key and the agreed display string.
2. Update this table above.
3. Use `LABELS.yourNewKey` in all components — never inline the string.
