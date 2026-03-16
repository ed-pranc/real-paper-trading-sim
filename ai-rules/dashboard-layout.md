# Enforce Dashboard Application Layout
---
name: dashboard-layout
description: Enforce 12-column Tailwind grid for dashboard pages and major layouts. Use for any layout, page or UI structure task.
---

# Enforce Dashboard Application Layout

- Every dashboard page and major layout MUST use `grid grid-cols-12 gap-6`  
- Sidebar / navigation / controls area: `col-span-12 lg:col-span-3`  
- Main content area (charts, forms, tables): `col-span-12 lg:col-span-9`  
- Mobile-first: everything stacks vertically by default (`col-span-12`)  
- Use `<div className="max-w-7xl mx-auto">` to wrap the grid when appropriate  
- Never place major content outside the 12-column grid structure  
- Do not suggest or use different `grid-cols-*` or `col-span-*` values that break the 3:9 desktop split unless explicitly requested

Reference existing dashboard files as examples.