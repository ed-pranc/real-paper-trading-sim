# Best Coding Practices
---
name: best-coding-practices
description: Enforce MVC, SOLID, KISS, YAGNI, JSDoc, Swagger, DRY and error handling on every change. Use for new code, refactors and reviews.
---

# Best Coding Practices

Apply these rules to every file and every task:

### MVC (adapted for Next.js 15)
- Models → lib/ and server actions  
- Views → app/ pages and components/  
- Controllers → app/api/ route handlers  

Keep each layer thin and focused.

### SOLID
- Single Responsibility: one job per component or route handler  
- Open/Closed: extend with new files, never edit existing ones  
- Use dependency injection via env and hooks

### KISS
Choose the simplest solution. No clever one-liners or premature abstraction.

### YAGNI
Add nothing “just in case”. Only implement what the ticket asks for right now.

### JSDoc
Every exported function must have:
```ts
/**
 * Short description.
 * @param {string} name - description
 * @returns {Promise<object>} description
 */