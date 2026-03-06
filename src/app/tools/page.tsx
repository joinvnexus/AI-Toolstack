'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ToolCard } from '@/components/tools/tool-card';
import { Search, Filter, Loader2, X } from 'lucide-react';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';

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
  const searchParams = useSearchParams();
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedPricing, setSelectedPricing] = useState(searchParams.get('pricing') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All' || categories.length === 0) return;

    const matchedByName = categories.find(
      (category) => category.name.toLowerCase() === selectedCategory.toLowerCase()
    );

    if (matchedByName && matchedByName.slug !== selectedCategory) {
      setSelectedCategory(matchedByName.slug);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '12');
        if (debouncedSearch) params.set('search', debouncedSearch);
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
  }, [debouncedSearch, normalizedCategory, selectedPricing, sortBy, page]);

  useEffect(() => {
    if (!isMobileFiltersOpen) return;

    const originalOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileFiltersOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileFiltersOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileFiltersOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () => mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
    setIsMobileFiltersOpen(false);
  };

  const handlePricingChange = (pricing: string) => {
    setSelectedPricing(pricing);
    setPage(1);
    setIsMobileFiltersOpen(false);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>AI Tools Directory</h1>
          <p className="mt-1 text-brand-muted">Discover the best AI tools for your needs</p>
        </div>
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="ui-btn ui-btn-ghost self-start !rounded-lg !px-3 lg:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {isMobileFiltersOpen && (
          <button
            aria-label="Close filters"
            onClick={() => setIsMobileFiltersOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        {/* Filters Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-[min(22rem,92vw)] overflow-y-auto p-3 transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:flex-shrink-0 lg:p-0 ${
            isMobileFiltersOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="ui-card h-full p-3 sm:p-5 lg:h-auto">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <h3 className="font-medium">Filters</h3>
              </div>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border ui-border bg-brand-surface lg:hidden"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Categories */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-brand-muted">Category</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                <button
                  onClick={() => handleCategoryChange('All')}
                  className={`min-h-10 w-full rounded-lg px-3 py-2 text-sm text-left transition ${
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
                    className={`min-h-10 w-full rounded-lg px-3 py-2 text-sm text-left transition ${
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {pricingOptions.map((pricing) => (
                  <button
                    key={pricing}
                    onClick={() => handlePricingChange(pricing)}
                    className={`min-h-10 w-full rounded-lg px-3 py-2 text-sm text-left transition ${
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
          <div className="ui-card p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form onSubmit={handleSearch} className="min-w-0 flex-1">
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
              className="ui-input w-full min-w-0 sm:w-52"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
            <div className="ui-card p-6 text-center sm:p-12">
              <p className="text-brand-muted">No tools found matching your criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="ui-btn ui-btn-ghost min-w-20 !rounded-lg !px-3 !py-2 disabled:opacity-50 sm:!px-4"
              >
                <span className="sm:hidden">Prev</span>
                <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="order-last w-full text-center text-sm text-brand-muted sm:order-none sm:w-auto">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ui-btn ui-btn-ghost min-w-20 !rounded-lg !px-3 !py-2 disabled:opacity-50 sm:!px-4"
              >
                <span className="sm:hidden">Next</span>
                <span className="hidden sm:inline">Next</span>
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


