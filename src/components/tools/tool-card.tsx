import Link from 'next/link';
import type { Tool } from '@/lib/constants/site';

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-brand-surface p-5 transition hover:-translate-y-0.5 hover:border-brand-primary/70">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-medium">{tool.name}</h3>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-brand-muted">{tool.category}</span>
      </div>
      <p className="text-sm text-brand-muted">{tool.description}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span>{tool.pricing}</span>
        <span>⭐ {tool.rating.toFixed(1)}</span>
      </div>
      <Link href={`/tools/${tool.slug}`} className="mt-4 inline-block text-sm text-brand-primary hover:underline">
        View details
      </Link>
    </article>
  );
}
