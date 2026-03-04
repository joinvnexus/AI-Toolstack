'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ToolCard } from '@/components/tools/tool-card';
import { Search, Filter, Loader2 } from 'lucide-react';

const pricingOptions = ['All', 'Free', 'Paid', 'Freemium'];
const sortOptions = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'name', label: 'Name' },
];

type Tool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  pricingModel: string;
  rating: number;
  reviewCount: number;
  category: {
    name: string;
  };
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  toolCount: number;
};

function ToolsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedPricing, setSelectedPricing] = useState(searchParams.get('pricing') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const normalizedCategory = (() => {
    if (selectedCategory === 'All') return 'All';

    const bySlug = categories.find((category) => category.slug === selectedCategory);
    if (bySlug) return bySlug.slug;

    const byName = categories.find(
      (category) => category.name.toLowerCase() === selectedCategory.toLowerCase()
    );

    return byName?.slug || selectedCategory;
  })();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);

        if (selectedCategory !== 'All') {
          const matchedByName = data.find(
            (category: Category) => category.name.toLowerCase() === selectedCategory.toLowerCase()
          );

          if (matchedByName && matchedByName.slug !== selectedCategory) {
            setSelectedCategory(matchedByName.slug);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '12');
        if (search) params.set('search', search);
        if (normalizedCategory !== 'All') params.set('category', normalizedCategory);
        if (selectedPricing !== 'All') params.set('pricing', selectedPricing);
        params.set('sort', sortBy);

        const res = await fetch(`/api/tools?${params.toString()}`);
        const data = await res.json();
        setTools(data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching tools:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, [search, normalizedCategory, selectedPricing, sortBy, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Tools Directory</h1>
          <p className="mt-1 text-brand-muted">Discover the best AI tools for your needs</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Filters Sidebar */}
        <aside className="w-full space-y-6 lg:w-64 lg:flex-shrink-0">
          <div className="ui-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Filters</h3>
            </div>
            
            {/* Categories */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-brand-muted">Category</h4>
              <div className="flex flex-wrap gap-2 lg:flex-col">
                <button
                  onClick={() => handleCategoryChange('All')}
                  className={`rounded-lg px-3 py-2 text-sm text-left transition ${
                    normalizedCategory === 'All'
                      ? 'bg-brand-primary text-white'
                      : 'bg-brand-primary/10 hover:bg-brand-primary/15'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => handleCategoryChange(category.slug)}
                    className={`rounded-lg px-3 py-2 text-sm text-left transition ${
                      normalizedCategory === category.slug
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-primary/10 hover:bg-brand-primary/15'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3 mt-6">
              <h4 className="text-sm font-medium text-brand-muted">Pricing</h4>
              <div className="flex flex-wrap gap-2">
                {pricingOptions.map((pricing) => (
                  <button
                    key={pricing}
                    onClick={() => {
                      setSelectedPricing(pricing);
                      setPage(1);
                    }}
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      selectedPricing === pricing
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-primary/10 hover:bg-brand-primary/15'
                    }`}
                  >
                    {pricing}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Search and Sort */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tools..."
                  className="ui-input ui-input-icon w-full py-2.5 pr-4"
                />
              </div>
            </form>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border ui-border bg-brand-surface px-4 py-2.5 text-sm outline-none focus:border-brand-primary"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <p className="text-sm text-brand-muted">
            Showing {tools.length} tools
          </p>

          {/* Tools Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : tools.length > 0 ? (
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
                    pricing: tool.pricingModel as 'FREE' | 'PAID' | 'FREEMIUM',
                    rating: tool.rating,
                    reviews: tool.reviewCount,
                    websiteUrl: '#'
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="ui-card p-12 text-center">
              <p className="text-brand-muted">No tools found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border ui-border bg-brand-surface px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-brand-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border ui-border bg-brand-surface px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolsPageFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<ToolsPageFallback />}>
      <ToolsPageContent />
    </Suspense>
  );
}


