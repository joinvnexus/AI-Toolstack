import Link from 'next/link';

export function BlogCard({ post }: { post: { slug: string; title: string; excerpt: string; readTime: string; date: string } }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-brand-surface p-6">
      <p className="text-xs text-brand-muted">{post.date}</p>
      <h3 className="mt-2 text-xl font-semibold">{post.title}</h3>
      <p className="mt-2 text-sm text-brand-muted">{post.excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-brand-muted">
        <span>{post.readTime}</span>
        <Link href={`/blog/${post.slug}`} className="text-brand-primary hover:underline">
          Read article
        </Link>
      </div>
    </article>
  );
}
