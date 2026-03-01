'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminCheck } from '@/lib/hooks/use-admin-check';
import { Loader2, Plus, Search, Edit, Trash2, Eye, AlertCircle } from 'lucide-react';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  publishedAt: string | null;
  readTime: number | null;
  author: {
    name: string | null;
  };
  categories: Array<{
    name: string;
  }>;
  createdAt: string;
};

export default function AdminPostsPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      return;
    }

    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blog?limit=100');
        if (res.ok) {
          const data = await res.json();
          setPosts(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [adminLoading, isAdmin]);

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    setDeleting(post.id);
    try {
      const res = await fetch(`/api/blog/${post.slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p.id !== post.id));
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-brand-muted">You don't have permission to access this page.</p>
        <Link href="/dashboard" className="mt-4 text-brand-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Blog Posts</h1>
          <p className="text-brand-muted">Create, edit, or remove blog posts</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
        >
          <Plus className="h-4 w-4" />
          Write New Post
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-brand-surface py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-primary placeholder:text-brand-muted"
        />
      </div>

      {/* Posts Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-brand-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Author</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Categories</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-brand-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{post.title}</p>
                        <p className="max-w-xs truncate text-sm text-brand-muted">{post.excerpt}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {post.author?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {post.categories?.map((cat, idx) => (
                          <span key={idx} className="rounded-full bg-white/5 px-2 py-0.5 text-xs">
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        post.published 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted">
                      {post.publishedAt 
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : new Date(post.createdAt).toLocaleDateString()
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-white"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/posts/${post.slug}/edit`}
                          className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-white"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deleting === post.id}
                          className="rounded-lg p-2 text-brand-muted hover:bg-white/10 hover:text-red-500 disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                    {searchQuery ? 'No posts found matching your search.' : 'No posts yet. Write your first post!'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
