'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Star, MapPin, DollarSign, Loader2, Bookmark, Share2 } from 'lucide-react';

type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  logoUrl: string;
  websiteUrl: string;
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

export default function ToolDetailsPage() {
  const params = useParams();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchTool = async () => {
      try {
        const res = await fetch(`/api/tools/${params.slug}`);
        if (res.ok) {
          const data = await res.json();
          setTool(data);
        }
      } catch (error) {
        console.error('Error fetching tool:', error);
      } finally {
        setLoading(false);
      }
    };
    if (params.slug) {
      fetchTool();
    }
  }, [params.slug]);

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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'alternatives', label: 'Alternatives' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-surface to-brand-background p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white">
            <span className="text-2xl font-bold text-black">{tool.name.charAt(0)}</span>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{tool.name}</h1>
                <p className="mt-2 text-brand-muted">{tool.description}</p>
              </div>
              
              <div className="flex gap-3">
                <button className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90">
                  <ExternalLink className="h-4 w-4" />
                  Visit Website
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10">
                  <Bookmark className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

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
                {tool.pricingModel}
                {tool.priceRange && ` • ${tool.priceRange}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 py-4 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-brand-primary text-white'
                  : 'border-transparent text-brand-muted hover:text-white'
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
            <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
              <h2 className="text-xl font-semibold">About</h2>
              <p className="mt-4 text-brand-muted whitespace-pre-line">{tool.longDescription || tool.description}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
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
                  <span>{tool.pricingModel}</span>
                </div>
                {tool.priceRange && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Price Range</span>
                    <span>{tool.priceRange}</span>
                  </div>
                )}
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
          <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
            <h2 className="text-xl font-semibold">User Reviews</h2>
            {tool.reviews.length > 0 ? (
              <div className="mt-6 space-y-6">
                {tool.reviews.map((review) => (
                  <div key={review.id} className="border-b border-white/10 pb-6 last:border-0">
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
                    <button className="mt-3 text-sm text-brand-muted hover:text-white">
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
        <div className="rounded-2xl border border-white/10 bg-brand-surface p-6">
          <h2 className="text-xl font-semibold">Similar Tools</h2>
          <p className="mt-4 text-brand-muted">Coming soon...</p>
        </div>
      )}
    </div>
  );
}
