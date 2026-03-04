'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { ExternalLink, Star, MapPin, DollarSign, Loader2, Bookmark, Share2, Send } from 'lucide-react';

type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  overview: string | null;
  features: string[];
  pros: string[];
  cons: string[];
  pricingDetails: string | null;
  alternativeTools: string[];
  videoUrl: string | null;
  conclusion: string | null;
  logoUrl: string;
  websiteUrl: string;
  affiliateUrl: string | null;
  pricingModel: string;
  priceRange: string | null;
  rating: number;
  reviewCount: number;
  views: number;
  category: {
    name: string;
    slug: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    content: string;
    helpfulCount: number;
    createdAt: string;
    user: {
      name: string | null;
      avatarUrl: string | null;
    };
  }>;
};

type SimilarTool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricingModel: string;
  rating: number;
  reviewCount: number;
};

export default function ToolDetailsPage() {
  const params = useParams();
  const slugParam = params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  const supabase = createClient();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [similarTools, setSimilarTools] = useState<SimilarTool[]>([]);
  const [bookmarkError, setBookmarkError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [{ data: authData }, toolRes] = await Promise.all([
          supabase.auth.getUser(),
          fetch(`/api/tools/${slug}`),
        ]);

        setUser(authData.user ?? null);

        if (toolRes.ok) {
          const toolData = await toolRes.json();
          setTool(toolData);
        }
      } catch (error) {
        console.error('Error loading tool details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchInitialData();
    }
  }, [slug, supabase]);

  useEffect(() => {
    const fetchSimilarTools = async () => {
      if (!tool?.category?.slug) {
        setSimilarTools([]);
        return;
      }

      try {
        const res = await fetch(
          `/api/tools?category=${encodeURIComponent(tool.category.slug)}&limit=6&sort=rating`
        );

        if (!res.ok) {
          setSimilarTools([]);
          return;
        }

        const data = await res.json();
        const related = (Array.isArray(data.data) ? data.data : [])
          .filter((item: SimilarTool) => item.slug !== tool.slug)
          .slice(0, 4);

        setSimilarTools(related);
      } catch (error) {
        console.error('Error fetching similar tools:', error);
        setSimilarTools([]);
      }
    };

    fetchSimilarTools();
  }, [tool?.category?.slug, tool?.slug]);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (user && tool) {
        const res = await fetch('/api/user/bookmarks');
        if (res.ok) {
          const bookmarks = await res.json();
          const bookmarked = bookmarks.some((b: any) => b.tool.id === tool.id);
          setIsBookmarked(bookmarked);
        }
      } else {
        setIsBookmarked(false);
      }
    };

    checkBookmarkStatus();
  }, [user, tool]);

  const handleBookmark = async () => {
    setBookmarkError('');

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!tool) {
      return;
    }

    try {
      if (isBookmarked) {
        const res = await fetch(`/api/user/bookmarks?toolId=${tool.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const errorData = await res.json();
          setBookmarkError(errorData.error || 'Failed to remove bookmark');
          return;
        }

        setIsBookmarked(false);
      } else {
        const res = await fetch('/api/user/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId: tool.id }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          setBookmarkError(errorData.error || 'Failed to bookmark tool');
          return;
        }

        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setBookmarkError('Failed to bookmark tool');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!slug) {
      setReviewError('Tool identifier is missing');
      return;
    }

    if (!reviewContent.trim()) {
      setReviewError('Please write a review');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');

    try {
      const res = await fetch(`/api/tools/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          content: reviewContent,
        }),
      });

      if (res.ok) {
        // Refresh tool data
        const toolRes = await fetch(`/api/tools/${slug}`);
        if (toolRes.ok) {
          const data = await toolRes.json();
          setTool(data);
        }
        setReviewContent('');
        setReviewRating(5);
      } else {
        const data = await res.json();
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch (error) {
      setReviewError('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Tool not found</h1>
        <p className="mt-2 text-brand-muted">The tool you are looking for does not exist.</p>
        <Link href="/tools" className="mt-4 inline-block text-brand-primary hover:underline">
          Browse all tools
        </Link>
      </div>
    );
  }

  // Format pricing model
  const formatPricing = (model: string) => {
    const models: Record<string, string> = {
      FREE: 'Free',
      PAID: 'Paid',
      FREEMIUM: 'Freemium',
    };
    return models[model] || model;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: `Reviews (${tool.reviewCount})` },
    { id: 'alternatives', label: 'Similar Tools' },
  ];

  const primaryUrl = tool.affiliateUrl || tool.websiteUrl;
  const primaryLabel = tool.affiliateUrl ? 'Visit via Affiliate' : 'Visit Website';
  const hasStructuredSections =
    Boolean(tool.overview?.trim()) ||
    tool.features.length > 0 ||
    tool.pros.length > 0 ||
    tool.cons.length > 0 ||
    Boolean(tool.pricingDetails?.trim()) ||
    tool.alternativeTools.length > 0 ||
    Boolean(tool.videoUrl?.trim()) ||
    Boolean(tool.conclusion?.trim());

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="ui-card-soft p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border ui-border bg-brand-surface">
            {tool.logoUrl ? (
              <img
                src={tool.logoUrl}
                alt={`${tool.name} logo`}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-black">{tool.name.charAt(0)}</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{tool.name}</h1>
                <p className="mt-2 text-brand-muted">{tool.description}</p>
              </div>
              
              <div className="flex gap-3">
                <a 
                  href={primaryUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
                >
                  <ExternalLink className="h-4 w-4" />
                  {primaryLabel}
                </a>
                {tool.affiliateUrl && (
                  <a
                    href={tool.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border ui-border bg-brand-primary/10 px-4 py-2 text-sm font-medium hover:bg-brand-primary/15"
                  >
                    Official Site
                  </a>
                )}
                <button 
                  onClick={handleBookmark}
                  className={`flex items-center gap-2 rounded-xl border ui-border px-4 py-2 text-sm font-medium hover:bg-brand-primary/15 ${
                    isBookmarked ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-primary/10'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button className="flex items-center gap-2 rounded-xl border ui-border bg-brand-primary/10 px-4 py-2 text-sm font-medium hover:bg-brand-primary/15">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {bookmarkError && (
              <p className="mt-3 text-sm text-red-400">{bookmarkError}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{tool.rating.toFixed(1)}</span>
                <span className="text-brand-muted">({tool.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-brand-muted">
                <MapPin className="h-4 w-4" />
                {tool.category.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-brand-muted">
                <DollarSign className="h-4 w-4" />
                {formatPricing(tool.pricingModel)}
                {tool.priceRange && ` | ${tool.priceRange}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b ui-border">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-4 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-brand-primary text-brand-text'
                  : 'border-transparent text-brand-muted hover:text-brand-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="ui-card p-6">
              <h2 className="text-xl font-semibold">Overview</h2>
              {hasStructuredSections ? (
                <div className="mt-4 space-y-6">
                  {tool.overview && (
                    <p className="text-brand-muted whitespace-pre-line">{tool.overview}</p>
                  )}

                  {tool.features.length > 0 && (
                    <section>
                      <h3 className="mb-2 text-base font-semibold">Features</h3>
                      <ul className="list-disc space-y-2 pl-5 text-brand-muted">
                        {tool.features.map((feature, index) => (
                          <li key={`${feature}-${index}`}>{feature}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {(tool.pros.length > 0 || tool.cons.length > 0) && (
                    <section className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                        <h3 className="text-base font-semibold text-green-300">Pros</h3>
                        {tool.pros.length > 0 ? (
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-brand-muted">
                            {tool.pros.map((item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-brand-muted">Not specified.</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <h3 className="text-base font-semibold text-red-300">Cons</h3>
                        {tool.cons.length > 0 ? (
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-brand-muted">
                            {tool.cons.map((item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-brand-muted">Not specified.</p>
                        )}
                      </div>
                    </section>
                  )}

                  {tool.pricingDetails && (
                    <section>
                      <h3 className="mb-2 text-base font-semibold">Pricing Details</h3>
                      <p className="text-brand-muted whitespace-pre-line">{tool.pricingDetails}</p>
                    </section>
                  )}

                  {tool.alternativeTools.length > 0 && (
                    <section>
                      <h3 className="mb-2 text-base font-semibold">Alternative Tools</h3>
                      <ul className="list-disc space-y-2 pl-5 text-brand-muted">
                        {tool.alternativeTools.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {tool.videoUrl && (
                    <section>
                      <h3 className="mb-2 text-base font-semibold">Video</h3>
                      <a
                        href={tool.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:underline"
                      >
                        Watch Video
                      </a>
                    </section>
                  )}

                  {tool.conclusion && (
                    <section>
                      <h3 className="mb-2 text-base font-semibold">Conclusion</h3>
                      <p className="text-brand-muted whitespace-pre-line">{tool.conclusion}</p>
                    </section>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-brand-muted whitespace-pre-line">
                  {tool.longDescription || tool.description}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="ui-card p-6">
              <h3 className="font-semibold">Quick Info</h3>
              <div className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Category</span>
                  <Link href={`/tools?category=${tool.category.slug}`} className="text-brand-primary hover:underline">
                    {tool.category.name}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Pricing</span>
                  <span>{formatPricing(tool.pricingModel)}</span>
                </div>
                {tool.priceRange && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Price Range</span>
                    <span>{tool.priceRange}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Website</span>
                  <a
                    href={tool.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-brand-primary hover:underline"
                  >
                    Open
                  </a>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-brand-muted">Affiliate</span>
                  {tool.affiliateUrl ? (
                    <a
                      href={tool.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-brand-primary hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-brand-muted">Not available</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Views</span>
                  <span>{tool.views}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Add Review Form */}
          {user ? (
            <div className="ui-card p-6">
              <h2 className="text-xl font-semibold">Write a Review</h2>
              <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 transition ${
                            star <= reviewRating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-brand-muted/40 hover:text-brand-muted'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Your Review</label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your experience with this tool..."
                    rows={4}
                    className="ui-input w-full"
                  />
                </div>
                {reviewError && (
                  <p className="text-sm text-red-500">{reviewError}</p>
                )}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50"
                >
                  {submittingReview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Review
                </button>
              </form>
            </div>
          ) : (
            <div className="ui-card p-6">
              <p className="text-brand-muted">
                <Link href="/login" className="text-brand-primary hover:underline">Sign in</Link> to write a review.
              </p>
            </div>
          )}

          {/* Reviews List */}
          <div className="ui-card p-6">
            <h2 className="text-xl font-semibold">User Reviews</h2>
            {tool.reviews.length > 0 ? (
              <div className="mt-6 space-y-6">
                {tool.reviews.map((review) => (
                  <div key={review.id} className="border-b ui-border pb-6 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/20">
                          {review.user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{review.user.name || 'Anonymous'}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-brand-muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-4 text-brand-muted">{review.content}</p>
                    <button className="mt-3 text-sm text-brand-muted hover:text-brand-text">
                      Helpful ({review.helpfulCount})
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-brand-muted">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'alternatives' && (
        <div className="ui-card p-6">
          <h2 className="text-xl font-semibold">Similar Tools</h2>
          {similarTools.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {similarTools.map((similarTool) => (
                <Link
                  key={similarTool.id}
                  href={`/tools/${similarTool.slug}`}
                  className="rounded-xl border ui-border bg-brand-primary/10 p-4 transition hover:border-brand-primary/60"
                >
                  <h3 className="font-medium">{similarTool.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-brand-muted">{similarTool.description}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-brand-muted">
                    <span>{formatPricing(similarTool.pricingModel)}</span>
                    <span>
                      {similarTool.rating.toFixed(1)} ({similarTool.reviewCount})
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-brand-muted">No similar tools found yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

