# AI ToolStack

> **A full-featured AI tools directory and content platform** built with modern web technologies.

Browse, review, and manage AI tools across categories. Features user authentication, ratings, bookmarks, blog content, and a complete admin dashboard.

## Features

### Public
- Tools directory with filtering (category, pricing, rating, search)
- Individual tool pages with reviews & ratings
- Blog with categorized posts & comments
- Global search across tools & blog

### Users
- Register/login with email or OAuth (Google, Facebook)
- Review tools (1–5 stars)
- Bookmark favorite tools
- Manage profile & avatar
- Comment on blog posts

### Admin
- Dashboard with stats (tools, users, reviews, posts)
- Full CRUD for tools, categories, blog posts, reviews, users
- Role management (USER/ADMIN)
- Moderate user-generated content

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase Postgres |
| ORM | Prisma 7 |
| Auth | Supabase Auth |
| Styling | Tailwind CSS v4 |
| Validation | Zod |
| State | Zustand |
| Hosting | Docker / Vercel / Railway |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local  # fill in your Supabase keys

# Run database migrations
npm run db:migrate

# Optional: Seed sample data (6 tools, categories, reviews, blog)
npm run db:seed

# Start development server
npm run dev  # → http://localhost:3000
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run test suite |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Populate seed data |
| `npm run db:reset` | Reset DB + re-migrate + seed |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes (REST endpoints)
│   │   │   ├── admin/          # Admin-only endpoints
│   │   │   ├── blog/           # Blog CRUD + comments
│   │   │   ├── categories/     # Category CRUD
│   │   │   ├── tools/          # Tool CRUD + reviews
│   │   │   └── user/           # User profile & data
│   │   ├── admin/              # Admin dashboard pages
│   │   ├── auth/               # Login, signup, OAuth callback
│   │   ├── blog/               # Blog listing & post pages
│   │   ├── dashboard/          # User dashboard
│   │   ├── search/             # Global search page
│   │   └── tools/              # Tools directory & detail
│   ├── lib/
│   │   ├── auth/               # Auth guards, role utils, sync
│   │   ├── prisma/             # Prisma singleton (adapter-pg)
│   │   ├── services/           # Business logic (blog, views)
│   │   └── supabase/           # Supabase clients (SSR/CSR)
│   └── types/                  # TypeScript definitions
├── prisma/
│   ├── schema.prisma           # Full DB schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Sample data (idempotent)
├── Dockerfile                  # Multi-stage production image
├── vercel.json                 # Vercel deployment config
├── DEPLOY.md                   # Deployment guides
└── README.md                   # This file
```

## API Reference

All endpoints follow REST conventions and return JSON.

### Public Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/tools` | List tools (query: ?category=, ?pricing=, ?search=, ?page=, ?limit=) |
| `GET` | `/api/tools/[slug]` | Tool details + reviews |
| `POST` | `/api/tools/[slug]/view` | Track tool page view |
| `GET` | `/api/tools/[slug]/reviews` | Reviews for tool (paginated) |
| `POST` | `/api/tools/[slug]/reviews` | Submit review (auth) |
| `GET` | `/api/categories` | All categories |
| `GET` | `/api/categories/[slug]` | Single category |
| `GET` | `/api/blog` | Blog posts filterable by ?category=, ?search=, ?includeDrafts= |
| `GET` | `/api/blog/[slug]` | Blog post + comments |
| `POST` | `/api/blog/[slug]/comments` | Add comment (auth) |
| `PATCH` | `/api/blog/[slug]/comments/[commentId]` | Edit own comment |
| `DELETE` | `/api/blog/[slug]/comments/[commentId]` | Delete own comment |

### Authenticated User Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/user/profile` | Current user profile |
| `PUT` | `/api/user/profile` | Update profile (name, avatar) |
| `GET` | `/api/user/reviews` | User's own reviews |
| `GET` | `/api/user/bookmarks` | User's bookmarked tools |
| `POST` | `/api/user/bookmarks` | Bookmark a tool |
| `DELETE` | `/api/user/bookmarks?toolId=` | Remove bookmark |
| `GET` | `/api/user/bookmarks/status?toolId=` | Check if tool is bookmarked |

### Admin Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/admin/stats` | Dashboard metrics & recent activity |
| `GET` | `/api/admin/users` | List all users (optionally ?email=) |
| `PUT` | `/api/admin/users` | Update user role (body: { email, role: USER\|ADMIN }) |
| `GET` | `/api/admin/reviews` | All reviews with pagination |
| `DELETE` | `/api/admin/reviews` | Delete any review (body: { id }) |
| `POST` | `/api/tools` | Create tool (auth: admin) |
| `PUT` | `/api/tools/[slug]` | Update tool |
| `DELETE` | `/api/tools/[slug]` | Delete tool + cascade reviews/bookmarks |
| `POST` | `/api/categories` | Create category |
| `PUT` | `/api/categories/[slug]` | Update category |
| `DELETE` | `/api/categories/[slug]` | Delete category (no tools attached) |
| `POST` | `/api/blog` | Create blog post (draft or published) |
| `PUT` | `/api/blog/[slug]` | Update blog post |
| `DELETE` | `/api/blog/[slug]` | Delete blog post |

**Common responses:**
- `200` – Success with data
- `201` – Resource created
- `400` – Validation error / conflict
- `401` – Not authenticated
- `403` – Not authorized (non-admin)
- `404` – Resource not found
- `500` – Server error

## Environment Variables

Copy `.env.example` → `.env.local` and fill these values (from Supabase dashboard):

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Database (Project Settings → Database)
# Use "Connection string" for DATABASE_URL (pgbouncer=true)
DATABASE_URL=postgresql://postgres:[password]@[host].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
# Use "Direct connection" for DIRECT_URL (for Prisma migrations)
DIRECT_URL=postgresql://postgres:[password]@[host].pooler.supabase.com:5432/postgres?sslmode=require
```

**Important:**
- `.env.local` is gitignored (never commit secrets)
- For production, set env vars in your hosting platform (Vercel/Railway/etc)
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the **anon (public) key**, not the service_role key

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatarUrl String?
  role      UserRole @default(USER)
  reviews   Review[]
  bookmarks Bookmark[]
  posts     BlogPost[]
}

model Tool {
  id              String   @id @default(cuid())
  name            String   @unique
  slug            String   @unique
  description     String   @db.Text
  longDescription String   @db.Text
  pricingModel    PricingModel
  rating          Float    @default(0)
  reviewCount     Int      @default(0)
  views           Int      @default(0)
  categoryId      String
  category        Category @relation(fields: [categoryId], references: [id])
  reviews         Review[]
  bookmarks       Bookmark[]
}

model Review {
  id        String   @id @default(cuid())
  rating    Int      // 1–5
  content   String   @db.Text
  userId    String
  toolId    String
  @@unique([userId, toolId])
}

model Category {
  id        String  @id @default(cuid())
  name      String  @unique
  slug      String  @unique
  toolCount Int     @default(0)
  tools     Tool[]
}

model BlogPost {
  id            String    @id @default(cuid())
  title         String
  slug          String    @unique
  content       String    @db.Text
  published     Boolean   @default(false)
  authorId      String
  author        User      @relation(fields: [authorId], references: [id])
  comments      BlogComment[]
}

model Bookmark {
  userId String
  toolId String
  @@unique([userId, toolId])
}
```

Full schema: [prisma/schema.prisma](./prisma/schema.prisma)

## Deployment

### Vercel (Recommended – 1-click)
```bash
npm i -g vercel
vercel --prod
```
Set environment variables in Vercel dashboard → Settings → Environment Variables.

### Docker (Any Cloud)
```bash
# Build image (~180MB)
docker build -t ai-toolstack .

# Run locally
docker run -p 3000:3000 ai-toolstack

# Push to registry & deploy anywhere (Railway, Render, ECS, etc)
docker tag ai-toolstack registry.example.com/ai-toolstack:latest
docker push registry.example.com/ai-toolstack:latest
```

Dockerfile uses multi-stage build + standalone output. See [DEPLOY.md](./DEPLOY.md) for alternatives (Railway, DigitalOcean, AWS).

**Production checklist:**
- [ ] Supabase project created + schema migrated (`npm run db:migrate`)
- [ ] Seeds loaded (optional: `npm run db:seed`)
- [ ] Auth redirects set: `https://your-domain.com/auth/callback`
- [ ] Env vars configured at hosting provider
- [ ] Custom domain + SSL (automatic on Vercel)
- [ ] OAuth providers (Google/Facebook) whitelist your domain
- [ ] Middleware rate limits tuned for traffic

## Development Notes

### Standalone Build
`output: 'standalone'` in `next.config.mjs` reduces image size and allows Node-only deployment. Copies minimal `node_modules` into `.next/standalone/`.

### Prisma Adapter
Uses `@prisma/adapter-pg` for serverless compatibility (needed for Vercel/Railway). Standard Prisma client fails in serverless environments without it.

### Auth Flow
1. User signs up → Supabase creates account + user metadata
2. `syncUserFromAuth()` creates/updates local `User` record on first API call
3. Role checked via `require-admin.ts` middleware for admin routes
4. Role resolution reads `app_metadata.role` from Supabase session

### Tool View Tracking
Unique daily views tracked via `ToolViewEvent` using visitor hash + date bucketing. Prevents duplicate counts from same visitor within 24h.

### Rate Limiting
None currently implemented. Consider adding `@upstash/ratelimit` or similar before public launch if not behind CDN/WAF.

## Contributing

PRs welcome. For substantial changes, open an issue first to discuss.

1. Fork → branch → commit → push → PR
2. Run `npm run typecheck` and `npm run lint` before submitting
3. Add tests for new business logic (`tests/` using Vitest)

## License

MIT – see LICENSE file for details.
