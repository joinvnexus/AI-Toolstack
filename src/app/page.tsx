import Link from 'next/link';
import { ToolCard } from '@/components/tools/tool-card';
import { BlogCard } from '@/components/blog/blog-card';
import { blogPosts, tools } from '@/lib/constants/site';

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-primary/30 to-brand-accent/20 p-10">
        <p className="text-sm text-brand-muted">Discover • Compare • Learn</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Find the best AI tools for your next breakthrough.</h1>
        <p className="mt-4 max-w-2xl text-brand-muted">
          AI Toolstack is your one-stop AI tools directory and blog to discover trusted tools, authentic reviews, and practical guides.
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/tools" className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black">
            Explore Tools
          </Link>
          <Link href="/blog" className="rounded-full border border-white/30 px-5 py-2 text-sm font-medium">
            Read Blog
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured Tools</h2>
          <Link href="/tools" className="text-sm text-brand-primary hover:underline">View all</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-2xl font-semibold">Latest Blog Posts</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {blogPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
