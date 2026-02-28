import { notFound } from 'next/navigation';
import { blogPosts } from '@/lib/constants/site';

type Props = { params: { slug: string } };

const toc = ['Why AI tool selection fails', 'Evaluation criteria', 'Pilot plan template', 'Decision checklist'];

export default function BlogPostPage({ params }: Props) {
  const post = blogPosts.find((item) => item.slug === params.slug);
  if (!post) return notFound();

  return (
    <article className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div className="prose prose-invert max-w-3xl">
        <p className="text-sm text-brand-muted">
          {post.date} · {post.readTime}
        </p>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <h2 id="criteria">Evaluation criteria</h2>
        <p>
          Focus on problem fit, adoption friction, long-term costs, integration flexibility, and measurable outcomes. Start with one high-value
          use case and define success metrics before rollout.
        </p>
        <h2 id="pilot">Pilot plan template</h2>
        <p>
          Use a 2–4 week pilot with a clear baseline, owner, and review cadence. Capture qualitative team feedback and quantitative impact on
          speed and quality.
        </p>
      </div>

      <aside className="h-fit rounded-2xl border border-white/10 bg-brand-surface p-4 lg:sticky lg:top-24">
        <p className="mb-2 text-sm font-medium">Table of contents</p>
        <ul className="space-y-2 text-sm text-brand-muted">
          {toc.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
    </article>
  );
}
