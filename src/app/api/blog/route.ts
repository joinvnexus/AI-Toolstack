import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';
import { slugify } from '@/lib/utils';

const parsePrismaErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

const estimateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

const createBlogPostSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().trim().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  featuredImage: z.string().url('Featured image URL must be valid').optional(),
  slug: z.string().optional(),
  categoryIds: z.array(z.string().trim().min(1)).optional(),
  published: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();
    const includeDrafts = ['1', 'true', 'yes'].includes(
      (searchParams.get('includeDrafts') || '').toLowerCase()
    );
    const sort = (searchParams.get('sort') || 'latest').toLowerCase();

    if (includeDrafts) {
      const admin = await requireAdmin();
      if (!admin.ok) return admin.response;
    }

    const where: Prisma.BlogPostWhereInput = {};

    if (!includeDrafts) {
      where.published = true;
    }

    if (category) {
      where.categories = {
        some: {
          slug: category
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orderBy: Prisma.BlogPostOrderByWithRelationInput[] =
      sort === 'oldest'
        ? [{ publishedAt: 'asc' }, { createdAt: 'asc' }]
        : [{ publishedAt: 'desc' }, { createdAt: 'desc' }];

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          categories: true
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ]);

    return NextResponse.json({
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const parsedBody = createBlogPostSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || 'Invalid request body' }, { status: 400 });
    }
    const { title, content, excerpt, featuredImage, slug, categoryIds = [], published } = parsedBody.data;

    const resolvedSlug = slugify(slug || title);
    if (!resolvedSlug) {
      return NextResponse.json({ error: 'A valid slug could not be generated' }, { status: 400 });
    }
    const shouldPublish = published === true;

    const post = await prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: admin.user.id },
        create: {
          id: admin.user.id,
          email: admin.user.email || `${admin.user.id}@local.invalid`,
          name: admin.user.name,
          avatarUrl: admin.user.avatarUrl,
          role: 'ADMIN'
        },
        update: {
          email: admin.user.email || `${admin.user.id}@local.invalid`,
          name: admin.user.name,
          avatarUrl: admin.user.avatarUrl,
          role: 'ADMIN'
        }
      });

      return tx.blogPost.create({
        data: {
          title,
          slug: resolvedSlug,
          content,
          excerpt: excerpt?.trim() || null,
          featuredImage: featuredImage?.trim() || null,
          readTime: estimateReadTime(content),
          authorId: admin.user.id,
          published: shouldPublish,
          publishedAt: shouldPublish ? new Date() : null,
          categories:
            categoryIds.length > 0
              ? {
                  connect: categoryIds.map((id: string) => ({ id }))
                }
              : undefined
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          },
          categories: true
        }
      });
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const errorCode = parsePrismaErrorCode(error);
    if (errorCode === 'P2002') {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 });
    }

    if (errorCode === 'P2025') {
      return NextResponse.json({ error: 'One or more selected categories do not exist' }, { status: 400 });
    }

    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
