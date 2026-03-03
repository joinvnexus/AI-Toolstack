import Link from 'next/link';
import { ToolCard } from '@/components/tools/tool-card';
import { BlogCard } from '@/components/blog/blog-card';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/layout/page-transition';
import { unstable_noStore as noStore } from 'next/cache';
import prisma from '@/lib/prisma';

const categoryIcons: Record<string, string> = {
  productivity: '⚡',
  'developer-tools': '💻',
  design: '🎨',
  marketing: '📈',
  writing: '✍️',
  video: '🎬',
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

const getExcerpt = (excerpt: string | null, content: string) => {
  if (excerpt?.trim()) return excerpt.trim();
  const plainText = content.replace(/\s+/g, ' ').trim();
  if (plainText.length <= 140) return plainText;
  return `${plainText.slice(0, 137)}...`;
};

export default async function HomePage() {
  noStore();

  const [
    categoryRows,
    toolRows,
    postRows,
    totalTools,
    totalUsers,
    totalReviews,
    totalPosts,
  ] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ toolCount: 'desc' }, { name: 'asc' }],
      take: 6,
      select: {
        name: true,
        slug: true,
        icon: true,
        toolCount: true,
      },
    }),
    prisma.tool.findMany({
      take: 3,
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      take: 2,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        categories: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.tool.count(),
    prisma.user.count(),
    prisma.review.count(),
    prisma.blogPost.count({ where: { published: true } }),
  ]);

  const categories = categoryRows.map((category) => ({
    name: category.name,
    slug: category.slug,
    icon: category.icon || categoryIcons[category.slug] || '•',
    toolCount: category.toolCount,
  }));

  const tools = toolRows.map((tool) => ({
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    longDescription: tool.longDescription,
    category: tool.category?.name || 'Uncategorized',
    features: [],
    pricing: tool.pricingModel,
    rating: tool.rating,
    reviews: tool.reviewCount,
    websiteUrl: tool.websiteUrl,
    logoUrl: tool.logoUrl,
  }));

  const blogPosts = postRows.map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: getExcerpt(post.excerpt, post.content),
    readTime: `${post.readTime || 1} min read`,
    date: formatDate(post.publishedAt || post.createdAt),
    category: post.categories[0]?.name || 'General',
  }));

  const stats = [
    { label: 'Total Tools', value: formatNumber(totalTools) },
    { label: 'Users', value: formatNumber(totalUsers) },
    { label: 'Reviews', value: formatNumber(totalReviews) },
    { label: 'Blog Posts', value: formatNumber(totalPosts) },
  ];

  return (
    <PageTransition>
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-primary/30 to-brand-accent/20 p-10">
          <FadeIn>
            <p className="text-sm text-brand-muted">Discover • Compare • Learn</p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
              Find the best AI tools for your next breakthrough.
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 max-w-2xl text-brand-muted">
              AI Toolstack is your one-stop AI tools directory and blog to discover trusted tools, authentic reviews, and practical guides.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <form action="/tools" className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                name="q"
                placeholder="Search tools, features, and categories..."
                className="w-full rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm outline-none placeholder:text-brand-muted focus:border-brand-primary sm:max-w-xl"
              />
              <button className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-gray-100 transition">
                Search
              </button>
            </form>
          </FadeIn>
        </section>

        {/* Categories Section */}
        <section>
          <FadeIn>
            <h2 className="mb-5 text-2xl font-semibold">Popular Categories</h2>
          </FadeIn>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <StaggerItem key={category.name}>
                <Link
                  href={`/tools?category=${encodeURIComponent(category.slug)}`}
                  className="group block rounded-2xl border border-white/10 bg-brand-surface p-5 transition hover:-translate-y-1 hover:border-brand-primary/60 hover:shadow-lg hover:shadow-brand-primary/10"
                >
                  <p className="text-3xl">{category.icon}</p>
                  <h3 className="mt-2 font-medium group-hover:text-brand-primary transition">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-brand-muted">{category.toolCount} tools</p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Featured Tools Section */}
        <section>
          <FadeIn>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Featured Tools</h2>
              <Link href="/tools" className="text-sm text-brand-primary hover:underline">
                View all
              </Link>
            </div>
          </FadeIn>
          <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.slice(0, 3).map((tool) => (
              <StaggerItem key={tool.id}>
                <ToolCard tool={tool} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Stats Section */}
        <section>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item, index) => (
              <StaggerItem key={item.label}>
                <FadeIn delay={index * 0.1}>
                  <div className="rounded-2xl border border-white/10 bg-brand-surface p-5">
                    <p className="text-2xl font-semibold">{item.value}</p>
                    <p className="text-sm text-brand-muted">{item.label}</p>
                  </div>
                </FadeIn>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* Blog Posts Section */}
        <section>
          <FadeIn>
            <h2 className="mb-5 text-2xl font-semibold">Latest Blog Posts</h2>
          </FadeIn>
          <StaggerContainer className="grid gap-4 md:grid-cols-2">
            {blogPosts.map((post) => (
              <StaggerItem key={post.slug}>
                <BlogCard post={post} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </div>
    </PageTransition>
  );
}
