'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ToolCard } from '@/components/tools/tool-card';
import { BlogCard } from '@/components/blog/blog-card';
import { BlogCardSkeleton, EmptyState, ErrorState, ToolCardSkeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/ui-store';

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
  const [errorMessage, setErrorMessage] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const recentSearches = useUIStore((state) => state.recentSearches);
  const addRecentSearch = useUIStore((state) => state.addRecentSearch);
  const clearRecentSearches = useUIStore((state) => state.clearRecentSearches);

  useEffect(() => {
    if (!query) {
      setTools([]);
      setPosts([]);
      setToolTotal(0);
      setPostTotal(0);
      setErrorMessage('');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const [toolsRes, postsRes] = await Promise.all([
          fetch(`/api/tools?search=${encodeURIComponent(query)}&limit=6&sort=rating`, {
            signal: controller.signal,
          }),
          fetch(`/api/blog?search=${encodeURIComponent(query)}&limit=6`, {
            signal: controller.signal,
          }),
        ]);
        if (!toolsRes.ok || !postsRes.ok) {
          throw new Error('Failed to fetch search results');
        }

        const [toolsData, postsData] = await Promise.all([toolsRes.json(), postsRes.json()]);

        if (!controller.signal.aborted) {
          setTools(Array.isArray(toolsData.data) ? toolsData.data : []);
          setPosts(Array.isArray(postsData.data) ? postsData.data : []);
          setToolTotal(typeof toolsData.total === 'number' ? toolsData.total : 0);
          setPostTotal(typeof postsData.total === 'number' ? postsData.total : 0);
          addRecentSearch(query);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error searching content:', error);
          setTools([]);
          setPosts([]);
          setToolTotal(0);
          setPostTotal(0);
          setErrorMessage('Could not load search results. Please retry.');
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
  }, [query, retryKey, addRecentSearch]);

  const totalResults = toolTotal + postTotal;

  return (
    <div className="space-y-10">
      <div>
        <h1>Search</h1>
        <p className="mt-2 text-brand-muted">Find tools and blog posts in one place.</p>
      </div>

      {!query ? (
        <div className="space-y-4">
          <EmptyState
            title="Start your search"
            description="Enter a search query from the navbar to see results."
          />
          {recentSearches.length > 0 && (
            <div className="ui-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Recent searches</h2>
                <button onClick={clearRecentSearches} className="text-xs text-brand-muted hover:text-brand-text">
                  Clear
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <Link
                    key={item}
                    href={`/search?q=${encodeURIComponent(item)}`}
                    className="ui-chip transition hover:text-brand-text"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <ToolCardSkeleton key={`tool-skeleton-${index}`} />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, index) => (
              <BlogCardSkeleton key={`blog-skeleton-${index}`} />
            ))}
          </div>
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Unable to load search results"
          description={errorMessage}
          onRetry={() => setRetryKey((current) => current + 1)}
        />
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <ToolCardSkeleton key={`tool-fallback-${index}`} />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <BlogCardSkeleton key={`blog-fallback-${index}`} />
        ))}
      </div>
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


