'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';
import { ToolCard } from '@/components/tools/tool-card';
import { BlogCard } from '@/components/blog/blog-card';

type ToolResult = {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricingModel: 'FREE' | 'PAID' | 'FREEMIUM' | string;
  rating: number;
  reviewCount: number;
  category: {
    name: string;
  };
};

type BlogResult = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  readTime: number | null;
  publishedAt: string | null;
  categories: Array<{
    name: string;
  }>;
};

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<ToolResult[]>([]);
  const [posts, setPosts] = useState<BlogResult[]>([]);
  const [toolTotal, setToolTotal] = useState(0);
  const [postTotal, setPostTotal] = useState(0);

  useEffect(() => {
    if (!query) {
      setTools([]);
      setPosts([]);
      setToolTotal(0);
      setPostTotal(0);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      setLoading(true);

      try {
        const [toolsRes, postsRes] = await Promise.all([
          fetch(`/api/tools?search=${encodeURIComponent(query)}&limit=6&sort=rating`, {
            signal: controller.signal,
          }),
          fetch(`/api/blog?search=${encodeURIComponent(query)}&limit=6`, {
            signal: controller.signal,
          }),
        ]);

        const [toolsData, postsData] = await Promise.all([toolsRes.json(), postsRes.json()]);

        if (!controller.signal.aborted) {
          setTools(Array.isArray(toolsData.data) ? toolsData.data : []);
          setPosts(Array.isArray(postsData.data) ? postsData.data : []);
          setToolTotal(typeof toolsData.total === 'number' ? toolsData.total : 0);
          setPostTotal(typeof postsData.total === 'number' ? postsData.total : 0);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error searching content:', error);
          setTools([]);
          setPosts([]);
          setToolTotal(0);
          setPostTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      controller.abort();
    };
  }, [query]);

  const totalResults = toolTotal + postTotal;

  return (
    <div className="space-y-10">
      <div>
        <h1>Search</h1>
        <p className="mt-2 text-brand-muted">Find tools and blog posts in one place.</p>
      </div>

      {!query ? (
        <div className="ui-card p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-brand-muted" />
          <p className="mt-4 text-brand-muted">
            Enter a search query from the navbar to see results.
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <>
          <div className="ui-card p-5">
            <p className="text-sm text-brand-muted">
              {totalResults} result{totalResults === 1 ? '' : 's'} found for{' '}
              <span className="font-medium text-brand-text">{query}</span>
            </p>
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Tools ({toolTotal})</h2>
              <Link href={`/tools?q=${encodeURIComponent(query)}`} className="text-sm text-brand-primary hover:underline">
                View all tools
              </Link>
            </div>
            {tools.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={{
                      id: tool.id,
                      name: tool.name,
                      slug: tool.slug,
                      description: tool.description,
                      longDescription: tool.description,
                      category: tool.category.name,
                      features: [],
                      pricing: (tool.pricingModel || 'FREE') as 'FREE' | 'PAID' | 'FREEMIUM',
                      rating: tool.rating,
                      reviews: tool.reviewCount,
                      websiteUrl: '#',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="ui-card p-10 text-center text-brand-muted">
                No tools matched this query.
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Blog Posts ({postTotal})</h2>
              <Link href="/blog" className="text-sm text-brand-primary hover:underline">
                Browse blog
              </Link>
            </div>
            {posts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={{
                      slug: post.slug,
                      title: post.title,
                      excerpt: post.excerpt || '',
                      readTime: `${post.readTime || 5} min read`,
                      date: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '',
                      category: post.categories[0]?.name || 'Blog',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="ui-card p-10 text-center text-brand-muted">
                No blog posts matched this query.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SearchPageFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}


