# AI ToolStack

An AI tools directory built with Next.js 14, Prisma, Supabase, and Tailwind CSS.

## Features

- Browse AI tools by category (Text, Image, Code, Video, Voice, Marketing)
- User reviews and ratings (1–5 stars)
- Bookmark favorite tools
- Blog with categories and comments
- Admin dashboard for content management
- OAuth sign-in (Google, Facebook)
- Tool view tracking

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase Postgres + Prisma ORM
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS v4
- **Validation:** Zod
- **State:** Zustand

## Quick Start

```bash
# Install
npm install

# Configure env
cp .env.example .env.local   # edit with your Supabase keys

# DB setup
npm run db:migrate
npm run db:seed              # optional sample data

# Run
npm run dev                  # http://localhost:3000
```

## NPM Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Start dev server |
| `build` | Create production build |
| `start` | Start production server |
| `lint` | Run ESLint |
| `typecheck` | TypeScript check |
| `test` | Run Vitest |
| `db:migrate` | Apply Prisma migrations |
| `db:seed` | Populate sample data |
| `db:reset` | Reset DB & reseed |
| `prisma:studio` | Open DB GUI |

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/          # API routes (19 endpoints)
│   ├── admin/        # Admin dashboard
│   ├── auth/         # Login, signup, callback
│   ├── blog/         # Blog listing & posts
│   └── tools/        # Tools listing & detail
├── lib/
│   ├── auth/         # Auth helpers & middleware
│   ├── prisma/       # Prisma client singleton
│   ├── services/     # Business logic (blog, tool views)
│   └── supabase/     # Supabase clients (browser/server)
└── types/            # TypeScript types
prisma/
├── schema.prisma     # DB schema
├── migrations/       # Migration history
└── seed.ts           # Sample data seeder
```

## API Routes

### Public
- `GET /api/tools` – list tools (filterable)
- `GET /api/tools/[slug]` – tool details + reviews
- `GET /api/categories` – all categories
- `GET /api/categories/[slug]` – category details
- `GET /api/blog` – blog posts
- `GET /api/blog/[slug]` – post + comments
- `POST /api/tools/[slug]/view` – track view

### Authenticated
- `GET/PUT /api/user/profile` – user profile
- `GET /api/user/reviews` – user's reviews
- `GET/POST/DELETE /api/user/bookmarks` – bookmark tools
- `GET/POST /api/tools/[slug]/comments` – comment on posts

### Admin Only
- `GET /api/admin/stats` – dashboard metrics
- `GET/PUT/DELETE /api/admin/users` – user management
- `GET/DELETE /api/admin/reviews` – review moderation
- `POST/PUT/DELETE /api/tools` – CRUD tools
- `POST/PUT/DELETE /api/categories` – CRUD categories
- `POST/PUT/DELETE /api/blog` – blog CRUD

## Deployment

See [DEPLOY.md](./DEPLOY.md) for step-by-step deployment guides.

Quick deploy to Vercel:
```bash
npm i -g vercel
vercel --prod
```

## License

MIT
