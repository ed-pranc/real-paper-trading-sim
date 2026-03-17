/**
 * Canonical display labels for financial metrics used throughout the app.
 * Import from here — never hardcode these strings in components.
 * See ai-rules/naming-conventions.md for rationale.
 */
export const LABELS = {
  cash:          'Available Cash',
  invested:      'Total Invested',
  unrealisedPnl: 'Unrealised P/L',
  realisedPnl:   'Realised P/L',
  totalValue:    'Total Value',
} as const
