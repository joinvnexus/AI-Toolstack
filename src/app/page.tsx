import Link from 'next/link';
import { ToolCard } from '@/components/tools/tool-card';
import { BlogCard } from '@/components/blog/blog-card';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/layout/page-transition';
import { unstable_noStore as noStore } from 'next/cache';
import prisma from '@/lib/prisma';

const categoryIcons: Record<string, string> = {
  productivity: '\u26a1',
  'developer-tools': '\ud83d\udcbb',
  design: '\ud83c\udfa8',
  marketing: '\ud83d\udcc8',
  writing: '\u270d\ufe0f',
  video: '\ud83c\udfac'
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);

const getExcerpt = (excerpt: string | null, content: string) => {
  if (excerpt?.trim()) return excerpt.trim();
  const plainText = content.replace(/\s+/g, ' ').trim();
  if (plainText.length <= 140) return plainText;
  return `${plainText.slice(0, 137)}...`;
};

type CategoryRow = {
  name: string;
  slug: string;
  icon: string | null;
  toolCount: number;
};

type ToolRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  pricingModel: 'FREE' | 'PAID' | 'FREEMIUM';
  rating: number;
  reviewCount: number;
  websiteUrl: string;
  logoUrl: string;
  category: {
    name: string;
  } | null;
};

type BlogRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  readTime: number | null;
  publishedAt: Date | null;
  createdAt: Date;
  categories: Array<{
    name: string;
  }>;
};

type CategoryCardItem = {
  name: string;
  slug: string;
  icon: string;
  toolCount: number;
};

type ToolCardItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  features: string[];
  pricing: 'FREE' | 'PAID' | 'FREEMIUM';
  rating: number;
  reviews: number;
  websiteUrl: string;
  logoUrl: string;
};

type BlogCardItem = {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  category: string;
};

type StatItem = {
  label: string;
  value: string;
};

export default async function HomePage() {
  noStore();

  const [categoryRows, toolRows, postRows, totalTools, totalUsers, totalReviews, totalPosts] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ toolCount: 'desc' }, { name: 'asc' }],
      take: 6,
      select: {
        name: true,
        slug: true,
        icon: true,
        toolCount: true
      }
    }),
    prisma.tool.findMany({
      take: 3,
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      take: 2,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        categories: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.tool.count(),
    prisma.user.count(),
    prisma.review.count(),
    prisma.blogPost.count({ where: { published: true } })
  ]);

  const categories: CategoryCardItem[] = categoryRows.map((category: CategoryRow) => ({
    name: category.name,
    slug: category.slug,
    icon: category.icon || categoryIcons[category.slug] || '\u2022',
    toolCount: category.toolCount
  }));

  const tools: ToolCardItem[] = toolRows.map((tool: ToolRow) => ({
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
    logoUrl: tool.logoUrl
  }));

  const blogPosts: BlogCardItem[] = postRows.map((post: BlogRow) => ({
    slug: post.slug,
    title: post.title,
    excerpt: getExcerpt(post.excerpt, post.content),
    readTime: `${post.readTime || 1} min read`,
    date: formatDate(post.publishedAt || post.createdAt),
    category: post.categories[0]?.name || 'General'
  }));

  const stats: StatItem[] = [
    { label: 'Total Tools', value: formatNumber(totalTools) },
    { label: 'Users', value: formatNumber(totalUsers) },
    { label: 'Reviews', value: formatNumber(totalReviews) },
    { label: 'Blog Posts', value: formatNumber(totalPosts) }
  ];

  return (
    <PageTransition>
      <div className="space-y-12 md:space-y-14">
        <section className="ui-card-soft relative overflow-hidden p-6 sm:p-8 md:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-brand-accent/10 to-brand-secondary/10" />
          <div className="relative">
            <FadeIn>
              <p className="text-sm text-brand-muted">Discover | Compare | Learn</p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                Find the best AI tools for your next breakthrough.
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-4 max-w-2xl text-brand-muted">
                AI Toolstack is your one-stop AI tools directory and blog to discover trusted tools, authentic
                reviews, and practical guides.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <form action="/tools" className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  name="q"
                  placeholder="Search tools, features, and categories..."
                  className="ui-input w-full sm:max-w-xl"
                />
                <button className="ui-btn ui-btn-primary !px-5">
                  Search
                </button>
              </form>
            </FadeIn>
          </div>
        </section>

        <section className="space-y-5">
          <FadeIn>
            <h2 className="section-title">Popular Categories</h2>
          </FadeIn>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <StaggerItem key={category.name}>
                <Link
                  href={`/tools?category=${encodeURIComponent(category.slug)}`}
                  className="ui-card group block p-5 transition hover:-translate-y-1 hover:border-brand-primary/60"
                >
                  <p className="text-3xl">{category.icon}</p>
                  <h3 className="mt-2 font-medium transition group-hover:text-brand-primary">{category.name}</h3>
                  <p className="mt-1 text-sm text-brand-muted">{category.toolCount} tools</p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section className="space-y-5">
          <FadeIn>
            <div className="flex items-center justify-between gap-4">
              <h2 className="section-title">Featured Tools</h2>
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

        <section>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item, index) => (
              <StaggerItem key={item.label}>
                <FadeIn delay={index * 0.1}>
                  <div className="ui-card p-5">
                    <p className="text-2xl font-semibold">{item.value}</p>
                    <p className="text-sm text-brand-muted">{item.label}</p>
                  </div>
                </FadeIn>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section className="space-y-5">
          <FadeIn>
            <h2 className="section-title">Latest Blog Posts</h2>
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
