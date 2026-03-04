'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminCheck } from '@/lib/hooks/use-admin-check';
import { AlertCircle, ExternalLink, Loader2, Search, Star, Trash2 } from 'lucide-react';

type Review = {
  id: string;
  rating: number;
  content: string;
  helpfulCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  tool: {
    id: string;
    name: string;
    slug: string;
  };
};

type FlashMessage = {
  type: 'success' | 'error';
  text: string;
};

export default function AdminReviewsPage() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | '5' | '4' | '3' | '2' | '1'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<FlashMessage | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/reviews?limit=200');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch reviews');
      }

      setReviews(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to fetch reviews',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchReviews();
    }
  }, [adminLoading, isAdmin]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const text = searchQuery.toLowerCase();
      const matchesSearch =
        review.content.toLowerCase().includes(text) ||
        review.tool.name.toLowerCase().includes(text) ||
        review.user.email.toLowerCase().includes(text) ||
        (review.user.name || '').toLowerCase().includes(text);

      const matchesRating =
        ratingFilter === 'ALL' ? true : review.rating === Number(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchQuery, ratingFilter]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const deleteReview = async (review: Review) => {
    if (!confirm('Delete this review? This action cannot be undone.')) return;

    setDeletingId(review.id);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to delete review');
      }

      setReviews((prev) => prev.filter((item) => item.id !== review.id));
      setMessage({ type: 'success', text: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete review',
      });
    } finally {
      setDeletingId(null);
    }
  };

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
        <p className="mt-2 text-brand-muted">You don&apos;t have permission to access this page.</p>
        <Link href="/dashboard" className="mt-4 text-brand-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Reviews</h1>
          <p className="text-brand-muted">Moderate user feedback and remove inappropriate reviews</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="ui-card p-4">
          <p className="text-sm text-brand-muted">Total Reviews</p>
          <p className="mt-2 text-2xl font-semibold">{reviews.length}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-brand-muted">Average Rating</p>
          <p className="mt-2 text-2xl font-semibold">{averageRating.toFixed(1)}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-brand-muted">Five-Star Reviews</p>
          <p className="mt-2 text-2xl font-semibold">{reviews.filter((r) => r.rating === 5).length}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by content, user, or tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ui-input w-full py-2 pl-10 pr-4"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value as 'ALL' | '5' | '4' | '3' | '2' | '1')}
          className="rounded-lg border ui-border bg-brand-surface px-4 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="ALL">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border ui-border bg-brand-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b ui-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Review</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Tool</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-brand-muted">Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-brand-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="border-b ui-border hover:bg-brand-primary/10">
                    <td className="px-4 py-3">
                      <p className="max-w-md text-sm">{review.content}</p>
                      <p className="mt-1 text-xs text-brand-muted">Helpful: {review.helpfulCount}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/tools/${review.tool.slug}`} className="hover:text-brand-primary">
                        {review.tool.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p>{review.user.name || 'Anonymous'}</p>
                      <p className="text-xs text-brand-muted">{review.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/20 px-2.5 py-1 text-xs font-medium text-brand-primary">
                        <Star className="h-3 w-3 fill-current" />
                        {review.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/tools/${review.tool.slug}`}
                          className="rounded-lg p-2 text-brand-muted hover:bg-brand-primary/15 hover:text-brand-text"
                          title="View Tool"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteReview(review)}
                          disabled={deletingId === review.id}
                          className="rounded-lg p-2 text-brand-muted hover:bg-brand-primary/15 hover:text-red-500 disabled:opacity-50"
                          title="Delete Review"
                        >
                          {deletingId === review.id ? (
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
                  <td colSpan={6} className="px-4 py-10 text-center text-brand-muted">
                    No reviews found for the selected filter.
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

