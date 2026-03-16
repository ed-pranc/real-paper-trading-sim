# Vercel Deploy
---
name: vercel-deploy
description: Handle build, env checks, and deployment to Vercel. Use whenever deployment or preview is mentioned.
---

# Vercel Deploy

Steps to follow:  

1. Run `pnpm run build` and confirm zero errors  
2. Check .env for required Vercel variables  
3. Run `vercel --prod` or `vercel deploy` for preview  
4. Confirm live URL and smoke-test the main pages