# AI Toolstack Setup Guide

This guide helps you run the project locally and deploy it safely.

## 1. Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (Auth + Postgres)

## 2. Install

```bash
npm install
```

## 3. Environment Variables

Copy `.env.example` values into `.env.local` (or project env in Vercel).

Required variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

Notes:

- Use your real app URL for `NEXT_PUBLIC_APP_URL` in production.
- For Supabase pooled DB URL (`:6543`) use `DATABASE_URL`.
- For direct/session pooler (`:5432`) use `DIRECT_URL`.

## 4. Database Migration

```bash
npm run db:migrate
```

Optional Prisma UI:

```bash
npx prisma studio
```

## 5. Run Locally

```bash
npm run dev
```

Open: `http://localhost:3000`

## 6. Production Build Check

```bash
npm run build
```

`build` already runs `prisma generate && next build`.

## 6.1 Dependency Governance Checks

Run these manually anytime:

```bash
npm run audit:prod
npm run audit:full
```

Automated weekly audit workflow:

- `.github/workflows/dependency-governance.yml`

## 7. Supabase OAuth Setup (Google/Facebook)

In Supabase dashboard:

1. Go to `Authentication > Providers`
2. Enable `Google` and/or `Facebook`
3. Set provider client ID and secret
4. Add redirect URL:
   - `https://your-domain.com/auth/callback`

## 8. Vercel Deploy

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

Set all required env vars in Vercel for `Production` and `Preview`.

## 9. Troubleshooting

- If build says `@prisma/client` exports are missing, make sure build command is `npm run build`.
- If OAuth fails, re-check Supabase provider config and callback URL.
- If DB connection fails, verify `DATABASE_URL`/`DIRECT_URL` values and SSL params.
