# AI Toolstack

A modern full-stack starter for an AI Tools Directory and Blogging Platform built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and App Router.

## Included in this implementation

- Marketing homepage with hero search, category cards, featured tools, and stats
- Tools directory with URL-driven filter/search/sort controls
- Tool details with quick facts, alternatives, and action sidebar
- Blog listing and post layout with a table of contents sidebar
- Auth, dashboard, and admin route placeholders
- API endpoints for tools and blog
- Prisma schema aligned with directory + review + blog workflows
- Tailwind brand palette and reusable layout/components

## Quickstart

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
```

## Next implementation phases

1. Wire Supabase Auth and protected route middleware.
2. Replace mock constants with Prisma + Supabase storage-backed data.
3. Add React Query + API-backed pagination and infinite loading.
4. Build review submission, helpful votes, and moderation.
5. Add rich text editor + admin CRUD workflows.
6. Add SEO metadata generators, sitemap, analytics, and Sentry.
