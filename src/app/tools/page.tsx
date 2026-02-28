import { ToolCard } from '@/components/tools/tool-card';
import { categories, tools } from '@/lib/constants/site';

type ToolsPageProps = {
  searchParams?: {
    q?: string;
    category?: string;
    pricing?: string;
    minRating?: string;
    sort?: string;
  };
};

export default function ToolsPage({ searchParams }: ToolsPageProps) {
  const query = searchParams?.q?.toLowerCase().trim() ?? '';
  const category = searchParams?.category ?? 'All';
  const pricing = searchParams?.pricing ?? 'All';
  const minRating = Number(searchParams?.minRating ?? 0);
  const sort = searchParams?.sort ?? 'Top Rated';

  const filtered = tools
    .filter((tool) => {
      if (category !== 'All' && tool.category !== category) return false;
      if (pricing !== 'All' && tool.pricing !== pricing) return false;
      if (minRating && tool.rating < minRating) return false;

      if (!query) return true;

      return [tool.name, tool.description, tool.category, ...tool.features]
        .join(' ')
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      if (sort === 'Top Rated') return b.rating - a.rating;
      if (sort === 'Most Reviewed') return b.reviews - a.reviews;
      return a.name.localeCompare(b.name);
    });

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tools Directory</h1>
        <p className="mt-2 text-brand-muted">Filter and compare modern AI tools by category, pricing, and rating.</p>
      </div>

      <form className="grid gap-4 rounded-2xl border border-white/10 bg-brand-surface p-4 md:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={searchParams?.q}
          placeholder="Search..."
          className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        />

        <select
          name="category"
          defaultValue={category}
          className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option>All</option>
          {categories.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          name="pricing"
          defaultValue={pricing}
          className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option>All</option>
          <option>Free</option>
          <option>Freemium</option>
          <option>Paid</option>
        </select>

        <select
          name="minRating"
          defaultValue={String(minRating || 0)}
          className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brand-primary"
        >
          <option value="0">Any rating</option>
          <option value="3">3★ & above</option>
          <option value="4">4★ & above</option>
        </select>

        <div className="flex gap-2">
          <select
            name="sort"
            defaultValue={sort}
            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          >
            <option>Top Rated</option>
            <option>Most Reviewed</option>
            <option>Name</option>
          </select>
          <button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium">Apply</button>
        </div>
      </form>

      <p className="text-sm text-brand-muted">Showing {filtered.length} of {tools.length} tools</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
