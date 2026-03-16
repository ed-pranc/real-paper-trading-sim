# Reuse Components Rule
---
name: reuse-components
description: Enforce reuse of existing components, hooks and design elements before creating anything new. Use for any UI, page or hook task.
---

# Reuse Components Rule

Before suggesting or writing any new UI component, hook, or design element:  
- First search the codebase for similar existing components (look in components/, ui/, lib/, etc.).  
- Reuse an existing one (or extend it with props) whenever it can reasonably match the needed design/function.  
- Only create something brand new when no suitable match exists – and explain why in a comment.  
- Prioritise shadcn/ui primitives and any custom components you have already built.  
- Keep visual style, spacing, and behaviour consistent with what's already in the project.

Reference existing files in the codebase as examples.