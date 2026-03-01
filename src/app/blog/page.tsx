'use client';

import { useState, useEffect } from 'react';
import { BlogCard } from '@/components/blog/blog-card';
import { Loader2 } from 'lucide-react';

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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/blog?page=${page}&limit=9`);
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
  }, [page]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Blog</h1>
        <p className="mt-2 text-brand-muted">Latest insights, guides, and news about AI tools</p>
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 bg-brand-surface px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-brand-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/10 bg-brand-surface px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-brand-surface p-12 text-center">
          <p className="text-brand-muted">No blog posts found.</p>
        </div>
      )}
    </div>
  );
}
