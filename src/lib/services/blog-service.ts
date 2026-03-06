import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/utils';

type AdminUserContext = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type ListBlogPostsInput = {
  page: number;
  limit: number;
  category: string | null;
  search: string | undefined;
  sort: string;
  includeDrafts: boolean;
};

type CreateBlogPostInput = {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  slug?: string;
  categoryIds?: string[];
  published?: boolean;
};

type UpdateBlogPostInput = {
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  slug?: string;
  categoryIds?: string[];
  published?: boolean;
};

const estimateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

const blogPostInclude = {
  author: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  },
  categories: true,
} satisfies Prisma.BlogPostInclude;

export const listBlogPosts = async ({
  page,
  limit,
  category,
  search,
  sort,
  includeDrafts,
}: ListBlogPostsInput) => {
  const where: Prisma.BlogPostWhereInput = {};

  if (!includeDrafts) {
    where.published = true;
  }

  if (category) {
    where.categories = {
      some: {
        slug: category,
      },
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.BlogPostOrderByWithRelationInput[] =
    sort === 'oldest'
      ? [{ publishedAt: 'asc' }, { createdAt: 'asc' }]
      : [{ publishedAt: 'desc' }, { createdAt: 'desc' }];

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: blogPostInclude,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    data: posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getBlogPostBySlug = async (slug: string) => {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: blogPostInclude,
  });
};

export const createBlogPost = async (input: CreateBlogPostInput, admin: AdminUserContext) => {
  const { title, content, excerpt, featuredImage, slug, categoryIds = [], published } = input;
  const resolvedSlug = slugify(slug || title);

  if (!resolvedSlug) {
    return { ok: false as const, error: 'A valid slug could not be generated' };
  }

  const shouldPublish = published === true;

  const post = await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: admin.id },
      create: {
        id: admin.id,
        email: admin.email || `${admin.id}@local.invalid`,
        name: admin.name,
        avatarUrl: admin.avatarUrl,
        role: 'ADMIN',
      },
      update: {
        email: admin.email || `${admin.id}@local.invalid`,
        name: admin.name,
        avatarUrl: admin.avatarUrl,
        role: 'ADMIN',
      },
    });

    return tx.blogPost.create({
      data: {
        title,
        slug: resolvedSlug,
        content,
        excerpt: excerpt?.trim() || null,
        featuredImage: featuredImage?.trim() || null,
        readTime: estimateReadTime(content),
        authorId: admin.id,
        published: shouldPublish,
        publishedAt: shouldPublish ? new Date() : null,
        categories:
          categoryIds.length > 0
            ? {
                connect: categoryIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: blogPostInclude,
    });
  });

  return { ok: true as const, data: post };
};

export const updateBlogPostBySlug = async (
  slug: string,
  existingPost: { published: boolean; publishedAt: Date | null },
  input: UpdateBlogPostInput
) => {
  const { title, content, excerpt, featuredImage, slug: slugInput, categoryIds, published } = input;
  const publishedProvided = typeof published === 'boolean';

  const nextSlug = slugInput !== undefined ? slugify(slugInput) : undefined;
  if (slugInput !== undefined && !nextSlug) {
    return { ok: false as const, error: 'Slug is invalid' };
  }

  let nextPublishedAt = existingPost.publishedAt;
  if (publishedProvided) {
    if (published === true && !existingPost.published) {
      nextPublishedAt = new Date();
    }
    if (published === false) {
      nextPublishedAt = null;
    }
  }

  const updatedPost = await prisma.blogPost.update({
    where: { slug },
    data: {
      title,
      slug: nextSlug,
      content,
      excerpt: excerpt === undefined ? undefined : excerpt || null,
      featuredImage: featuredImage === undefined ? undefined : featuredImage || null,
      readTime: content ? estimateReadTime(content) : undefined,
      published: publishedProvided ? published : undefined,
      publishedAt: publishedProvided ? nextPublishedAt : undefined,
      categories:
        categoryIds !== undefined
          ? {
              set: categoryIds.map((id: string) => ({ id })),
            }
          : undefined,
    },
    include: blogPostInclude,
  });

  return { ok: true as const, data: updatedPost };
};

export const deleteBlogPostBySlug = async (slug: string) => {
  await prisma.blogPost.delete({
    where: { slug },
  });
};
