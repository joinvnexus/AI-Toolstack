'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ToolCard } from '@/components/tools/tool-card';
import { Search, Filter, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useDebouncedValueWithStatus } from '@/lib/hooks/use-debounced-value';
import { EmptyState, ErrorState, ToolCardSkeleton } from '@/components/ui/skeleton';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const { debouncedValue: debouncedSearch, isDebouncing } = useDebouncedValueWithStatus(search, 350);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedPricing, setSelectedPricing] = useState(searchParams.get('pricing') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating');
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const hasMounted = useRef(false);

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
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (normalizedCategory !== 'All') params.set('category', normalizedCategory);
    if (selectedPricing !== 'All') params.set('pricing', selectedPricing);
    if (sortBy !== 'rating') params.set('sort', sortBy);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [debouncedSearch, normalizedCategory, selectedPricing, sortBy, page, router, pathname]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    setPage(1);
  }, [debouncedSearch, normalizedCategory, selectedPricing, sortBy]);

  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '12');
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (normalizedCategory !== 'All') params.set('category', normalizedCategory);
        if (selectedPricing !== 'All') params.set('pricing', selectedPricing);
        params.set('sort', sortBy);

        const res = await fetch(`/api/tools?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to fetch tools');
        }
        const data = await res.json();
        setTools(data.data || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching tools:', error);
        setTools([]);
        setTotalPages(1);
        setErrorMessage('Could not load tools for the selected filters.');
      } finally {
        setLoading(false);
      }
    };
    fetchTools();
  }, [debouncedSearch, normalizedCategory, selectedPricing, sortBy, page, reloadKey]);

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

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedPricing('All');
    setSortBy('rating');
    setPage(1);
  };

  const activeFilterCount =
    (debouncedSearch.trim() ? 1 : 0) +
    (normalizedCategory !== 'All' ? 1 : 0) +
    (selectedPricing !== 'All' ? 1 : 0) +
    (sortBy !== 'rating' ? 1 : 0);

  const selectedCategoryLabel =
    normalizedCategory === 'All'
      ? 'All Categories'
      : categories.find((item) => item.slug === normalizedCategory)?.name || 'Category';
  const selectedSortLabel = sortOptions.find((item) => item.value === sortBy)?.label || 'Top Rated';

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-primary/10 via-brand-surface/35 to-brand-background px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-background/75 px-3 py-1 text-xs font-medium text-brand-primary ring-1 ring-inset ring-brand-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              Curated AI Stack
            </p>
            <h1 className="mt-3">AI Tools Directory</h1>
            <p className="mt-1 text-brand-muted">Discover the best AI tools for your needs</p>
          </div>
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="ui-btn ui-btn-ghost self-start bg-brand-background/70 !rounded-xl !px-3 ring-1 ring-inset ring-brand-primary/20 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>
            )}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-brand-background/80 px-3 py-1 text-brand-muted">{selectedCategoryLabel}</span>
          <span className="rounded-full bg-brand-background/80 px-3 py-1 text-brand-muted">{selectedPricing}</span>
          <span className="rounded-full bg-brand-background/80 px-3 py-1 text-brand-muted">{selectedSortLabel}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {isMobileFiltersOpen && (
          <button
            aria-label="Close filters"
            onClick={() => setIsMobileFiltersOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        {/* Filters Sidebar */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 w-[min(22rem,92vw)] overflow-y-auto p-3 transition-transform duration-200 lg:sticky lg:top-24 lg:z-auto lg:h-[calc(100vh-7rem)] lg:w-auto lg:self-start lg:p-0 ${
            isMobileFiltersOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="h-full rounded-2xl bg-brand-background/95 p-3 ring-1 ring-inset ring-brand-primary/15 sm:p-5 lg:rounded-none lg:bg-transparent lg:p-0 lg:ring-0">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <h3 className="font-medium">Filters</h3>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-xs text-brand-primary">
                    {activeFilterCount} active
                  </span>
                )}
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border ui-border bg-brand-surface lg:hidden"
                  aria-label="Close filters"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Category</h4>
              <div className="grid max-h-72 grid-cols-2 gap-2 overflow-auto pr-1 sm:grid-cols-3 lg:grid-cols-1">
                <button
                  onClick={() => handleCategoryChange('All')}
                  className={`min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 active:scale-[0.99] ${
                    normalizedCategory === 'All'
                      ? 'bg-brand-primary text-white'
                      : 'bg-brand-surface hover:bg-brand-primary/10'
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.slug}
                    onClick={() => handleCategoryChange(category.slug)}
                    className={`min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 active:scale-[0.99] ${
                      normalizedCategory === category.slug
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-surface hover:bg-brand-primary/10'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1">{category.name}</span>
                      <span className={`text-xs ${normalizedCategory === category.slug ? 'text-white/90' : 'text-brand-muted'}`}>
                        {category.toolCount}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Pricing</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {pricingOptions.map((pricing) => (
                  <button
                    key={pricing}
                    onClick={() => handlePricingChange(pricing)}
                    className={`min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 active:scale-[0.99] ${
                      selectedPricing === pricing
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-surface hover:bg-brand-primary/10'
                    }`}
                  >
                    {pricing}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 border-t ui-border pt-4">
              <button
                onClick={clearAllFilters}
                className="ui-btn ui-btn-ghost !rounded-xl !px-3 !py-2"
                disabled={activeFilterCount === 0}
              >
                Clear
              </button>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="ui-btn ui-btn-primary !rounded-xl !px-3 !py-2 lg:hidden"
              >
                Apply
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Search and Sort */}
          <div className="rounded-2xl bg-brand-background p-3 ring-1 ring-inset ring-brand-primary/15 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b ui-border pb-3 text-xs text-brand-muted">
              <span>Live Search & Sort</span>
              <span>{activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={handleSearch} className="min-w-0 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tools..."
                    className="ui-input ui-input-icon w-full rounded-xl py-2.5 pr-4"
                  />
                </div>
              </form>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="ui-input w-full min-w-0 rounded-xl sm:w-52"
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
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm text-brand-muted">Showing {tools.length} tools</p>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="text-xs text-brand-primary hover:underline">
                  Reset all filters
                </button>
              )}
              {isDebouncing && <p className="text-xs text-brand-muted">Updating results...</p>}
            </div>
          </div>

          {/* Tools Grid */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <ToolCardSkeleton key={index} />
              ))}
            </div>
          ) : errorMessage ? (
            <ErrorState
              title="Unable to load tools"
              description={errorMessage}
              onRetry={() => setReloadKey((current) => current + 1)}
            />
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
            <EmptyState
              title="No tools found"
              description="Try changing search, category, or pricing filters."
              actionLabel="Clear filters"
              onAction={clearAllFilters}
            />
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <ToolCardSkeleton key={index} />
      ))}
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
