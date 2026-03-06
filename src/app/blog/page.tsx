'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlogCard } from '@/components/blog/blog-card';
import { Search } from 'lucide-react';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { BlogCardSkeleton, EmptyState, ErrorState } from '@/components/ui/skeleton';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  readTime: number | null;
  publishedAt: string | null;
  author: {
    name: string | null;
  };
  categories: Array<{
    name: string;
    slug: string;
  }>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

const sortOptions = [
  { value: 'latest', label: 'Latest first' },
  { value: 'oldest', label: 'Oldest first' }
];

function BlogPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const syncUrl = useCallback(
    (nextPage: number, nextSearch: string, nextCategory: string, nextSort: string) => {
      const params = new URLSearchParams();
      if (nextPage > 1) params.set('page', String(nextPage));
      if (nextSearch.trim()) params.set('search', nextSearch.trim());
      if (nextCategory !== 'all') params.set('category', nextCategory);
      if (nextSort !== 'latest') params.set('sort', nextSort);
      router.replace(params.toString() ? `/blog?${params.toString()}` : '/blog', { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '9');
        params.set('sort', sortBy);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        if (selectedCategory !== 'all') params.set('category', selectedCategory);

        const res = await fetch(`/api/blog?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to fetch blog posts');
        }
        const data = await res.json();
        setPosts(data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        setPosts([]);
        setTotalPages(1);
        setErrorMessage('Could not load blog posts right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    syncUrl(page, debouncedSearch, selectedCategory, sortBy);
  }, [page, debouncedSearch, selectedCategory, sortBy, syncUrl, reloadKey]);

  return (
    <div className="space-y-10">
      <div>
        <h1>Blog</h1>
        <p className="mt-2 text-brand-muted">Latest insights, guides, and news about AI tools</p>
      </div>

      <div className="ui-card p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3  top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search blog posts..."
              className="ui-input ui-input-icon w-full py-2 pr-4"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setPage(1);
              setSelectedCategory(e.target.value);
            }}
            className="ui-input min-w-44 py-2"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => {
              setPage(1);
              setSortBy(e.target.value);
            }}
            className="ui-input min-w-40 py-2"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <BlogCardSkeleton key={index} />
          ))}
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Unable to load blog posts"
          description={errorMessage}
          onRetry={() => setReloadKey((current) => current + 1)}
        />
      ) : posts.length > 0 ? (
        <>
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
                  category: post.categories[0]?.name || 'Blog'
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="ui-btn ui-btn-ghost !rounded-lg !px-4 !py-2 disabled:opacity-50"
            >
              Previous
            </button>
              <span className="text-sm text-brand-muted">
                Page {page} of {totalPages}
              </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="ui-btn ui-btn-ghost !rounded-lg !px-4 !py-2 disabled:opacity-50"
            >
              Next
            </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No blog posts found"
          description="Try another search term or switch category filters."
          actionLabel="Reset filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('all');
            setSortBy('latest');
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

function BlogPageFallback() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <BlogCardSkeleton key={index} />
      ))}
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogPageFallback />}>
      <BlogPageContent />
    </Suspense>
  );
}

