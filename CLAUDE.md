# CLAUDE Instructions – Always Active

Reference ai-rules/ files on every task.  
Start with project-onboarding.md.  
Use shadcn-ui-specialist for all UI tasks.  
Delegate to api-specialist for backend.  
Run architecture-guardian at the end of every task.

## Date Formatting Rule

All user-facing dates must use MM/DD/YYYY format.
- Date only → `fmtDate(isoString)` from `lib/utils.ts`
- Date + time → `fmtDateTime(isoString)` from `lib/utils.ts`
- Never render raw ISO strings (YYYY-MM-DD) or `.toISOString()` output directly to the UI.
- Chart axis labels may use abbreviated formats (e.g. MMM D, MM/DD) for space reasons — this is the only exception.