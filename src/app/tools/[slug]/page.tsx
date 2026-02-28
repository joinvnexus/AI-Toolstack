import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tools } from '@/lib/constants/site';

type Props = { params: { slug: string } };

export default function ToolDetailsPage({ params }: Props) {
  const tool = tools.find((item) => item.slug === params.slug);
  if (!tool) return notFound();

  const alternatives = tools.filter((item) => item.category === tool.category && item.id !== tool.id).slice(0, 3);

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
        <h1 className="text-3xl font-bold">{tool.name}</h1>
        <p className="mt-3 text-brand-muted">{tool.longDescription}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {tool.features.map((feature) => (
            <span key={feature} className="rounded-full border border-white/10 px-3 py-1 text-xs text-brand-muted">
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/10 bg-brand-surface p-6 md:grid-cols-4">
        <div>
          <p className="text-xs text-brand-muted">Category</p>
          <p>{tool.category}</p>
        </div>
        <div>
          <p className="text-xs text-brand-muted">Pricing</p>
          <p>{tool.pricing}</p>
        </div>
        <div>
          <p className="text-xs text-brand-muted">Rating</p>
          <p>⭐ {tool.rating.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-brand-muted">Reviews</p>
          <p>{tool.reviews}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-brand-surface p-6">
            <h2 className="text-xl font-semibold">Overview</h2>
            <p className="mt-2 text-brand-muted">
              This section is prepared for full rich content (screenshots, setup steps, integrations, and use cases). Connect Prisma content and
              markdown/TipTap rendering in the next backend phase.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-brand-surface p-6">
            <h2 className="text-xl font-semibold">Alternatives</h2>
            <div className="mt-3 space-y-3">
              {alternatives.length === 0 ? (
                <p className="text-sm text-brand-muted">No alternatives available yet.</p>
              ) : (
                alternatives.map((item) => (
                  <Link key={item.id} href={`/tools/${item.slug}`} className="block rounded-lg border border-white/10 p-3 hover:border-brand-primary/60">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-brand-muted">{item.description}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-brand-surface p-6">
          <a href={tool.websiteUrl} className="block rounded-lg bg-brand-primary px-4 py-2 text-center text-sm font-semibold" target="_blank" rel="noreferrer">
            Visit Website
          </a>
          <button className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm">Save Tool</button>
          <button className="w-full rounded-lg border border-white/20 px-4 py-2 text-sm">Share</button>
        </aside>
      </div>
    </section>
  );
}
