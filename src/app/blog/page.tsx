import { BlogCard } from '@/components/blog/blog-card';
import { blogPosts } from '@/lib/constants/site';

export default function BlogPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Blog</h1>
      <p className="mt-2 text-brand-muted">Guides, comparisons, and practical AI workflows.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {blogPosts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
