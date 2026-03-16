# Next.js Conventions
---
name: nextjs-conventions
description: Enforce Next.js 15 App Router structure, server components, route handlers, and shadcn/ui theming rules. Use for any new feature, refactor, or component work.
---

# Next.js Conventions

Follow these rules exactly:  

- Structure: app/ directory with page.tsx, layout.tsx, loading.tsx, error.tsx  
- Always import shadcn/ui components instead of plain Tailwind where possible  
- Use server actions for mutations, route handlers for API  
- Components: PascalCase, single file, use "use client" only when needed  
- Pages: always add proper metadata and loading states  

When creating anything new, ask the user only if the requirement is unclear. Reference existing files in the codebase as examples.