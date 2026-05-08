# AI ToolStack – Production Deployment Guide

## Pre-deploy Checklist

### 1. Environment Variables
Update production environment variables in your hosting platform:

```bash
NEXT_PUBLIC_APP_URL=<your-production-url>
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
DATABASE_URL=postgresql://postgres:<password>@<host>.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://postgres:<password>@<host>.pooler.supabase.com:5432/postgres?sslmode=require
```

### 2. Database Migrations
Run migrations on production database:
```bash
npm run db:migrate
npm run db:seed   # Optional: only on fresh DB
```

### 3. Supabase Setup
- Auth providers (Google, Facebook) configured in Supabase dashboard
- Redirect URLs added: `https://<your-domain>/auth/callback`
- Email confirmations disabled or configured

---

## Deploy Options

### Option A: Vercel (Recommended for Next.js)
1. Push code to GitHub
2. Import project in Vercel
3. Set env vars in Vercel dashboard
4. Deploy – automatic on every push to main

### Option B: Railway (Full-stack with DB)
1. Create new project from GitHub
2. Add PostgreSQL plugin (or use Supabase external DB)
3. Set env vars
4. Deploy

### Option C: Docker (Any cloud)
```bash
docker build -t ai-toolstack .
docker run -p 3000:3000 ai-toolstack
```

### Option D: DigitalOcean / AWS / GCP
Use Dockerfile or Node.js 20+ runtime with:
- Build step: `npm ci && npm run build`
- Start: `npm start` (uses Next.js standalone output)

---

## Post-Deploy

1. Verify health: `GET /api/health` (if added) or homepage
2. Test signup/login flows
3. Check API routes return 200 status
4. Admin panel accessible at `/admin`
5. Database connection stable (check hosting logs)

---

## Notes

- Uses Next.js 14 App Router
- Prisma 7 with Supabase Postgres
- Auth via Supabase Auth
- Docker multi-stage build produces ~180MB image
- Standalone output enabled (`.next/standalone`)
