# Responsive Design Guidelines
---
name: responsive-design
description: Enforce mobile-first responsive layouts with Tailwind and shadcn/ui. Use for any new page, component, layout or UI task.
---

# Responsive Design Guidelines

Always build mobile-first responsive layouts.

- Start with base (mobile) styles without prefixes.  
- Use Tailwind responsive prefixes (sm:, md:, lg:, xl:, 2xl:) only for adjustments on larger screens.  
- Apply responsive utilities to layout, spacing, typography, and visibility.  
- Leverage shadcn/ui components – they are responsive by default. Customise with Tailwind classes when needed.  
- Ensure every new page, component, or layout works well on phones, tablets, and desktops.  
- Add viewport meta tag if missing.  
- Test suggestions mentally across common breakpoints before finalising code.  
- Never use fixed pixel widths/heights for containers unless intentional.

Reference existing files in the codebase as examples.