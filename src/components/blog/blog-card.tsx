import Link from 'next/link';

export function BlogCard({ post }: { post: { slug: string; title: string; excerpt: string; readTime: string; date: string; category: string } }) {
  return (
    <article className="ui-card h-full p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-brand-muted">{post.date}</p>
        <span className="rounded-full border ui-border px-2 py-1 text-xs text-brand-muted">{post.category}</span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-lg font-semibold sm:text-xl">{post.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-brand-muted">{post.excerpt}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-brand-muted">
        <span>{post.readTime}</span>
        <Link href={`/blog/${post.slug}`} className="inline-flex min-h-11 items-center text-brand-primary hover:underline">
          Read article
        </Link>
      </div>
    </article>
  );
}
