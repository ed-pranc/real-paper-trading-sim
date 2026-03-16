# Project Onboarding
---
name: project-onboarding
description: Living blueprint of the entire project. Auto-updated by the guardian on every change.
---

# Living Project Blueprint

**Last updated:** [auto-filled by guardian]

**Purpose:** RealPaperTradingSim is an eToro-style stock trading simulator using real and historical prices from Twelve Data API, with full date-based simulation. All portfolio actions, watchlist, history, transactions and charts are stored in Supabase.

**Full spec:** Read `ai-rules/app-spec.md` for the complete product specification, data model, page-by-page requirements and evaluation criteria before starting any task.

**Architecture:** Next.js 15 App Router with React 19, app directory, server actions and route handlers, lib/ for business logic, 12-column Tailwind grid for layouts, shadcn/ui components, Supabase with Google Auth, recharts for charts, Twelve Data API.

**Current packages (auto):**  
[guardian fills this list]

**Server routes (auto):**  
[guardian fills this list]

**Run commands:**  
- Local: pnpm install && pnpm run dev  
- Build: pnpm run build  
- Deploy: vercel

**Protected files:** never edit next.config.js or .env without guardian review.

Reference this file for any architecture or new-feature task.