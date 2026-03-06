# AI Toolstack

AI Toolstack is a full-stack AI tools directory and blog platform built with Next.js, Supabase, and Prisma.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth
- Prisma + PostgreSQL

## Main Features

- Public pages:
  - Homepage
  - Tools directory
  - Tool details (reviews, bookmarks, similar tools)
  - Blog list and blog details
  - Global search page
- Authentication:
  - Email/password login and signup
  - Google and Facebook OAuth
  - Forgot/reset password flow
- User dashboard:
  - Bookmarks
  - Reviews
  - Settings
- Admin panel:
  - Tools, categories, blog posts, users, reviews
  - Admin stats and role management

## Quick Start

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
```

Build command already includes Prisma client generation:

- `prisma generate && next build`

## Environment Variables

Use values from `.env.example`. Required keys:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

## Project Docs

- Setup guide: [PROJECT_SETUP.md](./PROJECT_SETUP.md)
- Project status and completed checklist: [TODO.md](./TODO.md)
- Dependency governance policy: [DEPENDENCY_GOVERNANCE.md](./DEPENDENCY_GOVERNANCE.md)
