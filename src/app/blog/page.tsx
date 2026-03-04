'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlogCard } from '@/components/blog/blog-card';
import { Loader2, Search } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');

  const syncUrl = (nextPage: number, nextSearch: string, nextCategory: string, nextSort: string) => {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set('page', String(nextPage));
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextCategory !== 'all') params.set('category', nextCategory);
    if (nextSort !== 'latest') params.set('sort', nextSort);
    router.replace(params.toString() ? `/blog?${params.toString()}` : '/blog', { scroll: false });
  };

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
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '9');
        params.set('sort', sortBy);
        if (search.trim()) params.set('search', search.trim());
        if (selectedCategory !== 'all') params.set('category', selectedCategory);

        const res = await fetch(`/api/blog?${params.toString()}`);
        const data = await res.json();
        setPosts(data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    syncUrl(page, search, selectedCategory, sortBy);
  }, [page, search, selectedCategory, sortBy]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="mt-2 text-brand-muted">Latest insights, guides, and news about AI tools</p>
      </div>

      <div className="ui-card p-4">
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
              className="ui-input ui-input-icon w-full py-2 pr-4 "
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
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
                className="rounded-lg border ui-border bg-brand-surface px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-brand-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="rounded-lg border ui-border bg-brand-surface px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="ui-card p-12 text-center">
          <p className="text-brand-muted">No blog posts found.</p>
        </div>
      )}
    </div>
  );
}

function BlogPageFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
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

