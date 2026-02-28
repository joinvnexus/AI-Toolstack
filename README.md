# AI Toolstack

A modern full-stack starter for an AI Tools Directory and Blogging Platform built with Next.js 14, TypeScript, Tailwind CSS, Prisma, and App Router.

## Included in this initial implementation

- Marketing homepage with hero, featured tools, and latest posts
- Tools directory and tool details route
- Blog listing and blog post route
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
npm run lint
```

## Next implementation phases

1. Wire Supabase Auth and protected route middleware.
2. Replace mock constants with Prisma + Supabase storage-backed data.
3. Add filters/search/sorting with React Query + server pagination.
4. Build review submission, helpful votes, and moderation.
5. Add rich text editor + admin CRUD workflows.
6. Add SEO metadata generators, sitemap, analytics, and Sentry.
