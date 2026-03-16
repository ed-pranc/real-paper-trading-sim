
# Security Practices
---
name: security-practices
description: Enforce the latest OWASP Top 10, NIST controls, latest libraries, zero known vulnerabilities and SQL injection resilience. Use on every code change or before merge.
---

# Security Practices

Follow these rules exactly on all work:

### Latest OWASP Top 10
- Broken Access Control: enforce auth in every route handler  
- Injection (SQL, XSS, command): never concatenate strings  
- Security Misconfiguration: use Next.js headers and middleware  
- Vulnerable and Outdated Components: fix via npm audit

### Dependencies and Vulnerabilities
- Run `pnpm audit` after every install or change  
- Keep all libraries at latest stable versions  
- Enable GitHub Dependabot  
- Fix every high or critical alert immediately  
- Never ship with known CVEs

### SQL Injection Prevention
- Use Supabase client or prepared statements  
- Validate all inputs with Zod before queries  
- Never build SQL strings with user data

### General Rules
- Store secrets only in .env and process.env  
- Apply CSP, HSTS and security headers via next.config.js  
- Rate-limit all API routes  
- Log errors without exposing stack traces or keys  
- Validate and sanitise every user input on the server