import { notFound } from 'next/navigation';
import { tools } from '@/lib/constants/site';

type Props = { params: { slug: string } };

export default function ToolDetailsPage({ params }: Props) {
  const tool = tools.find((item) => item.slug === params.slug);
  if (!tool) return notFound();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">{tool.name}</h1>
      <p className="text-brand-muted">{tool.description}</p>
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-brand-surface p-6 md:grid-cols-3">
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
      </div>
    </section>
  );
}
