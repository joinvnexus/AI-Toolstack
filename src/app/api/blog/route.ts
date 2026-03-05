import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

const parsePrismaErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

type AdminCheckResult = {
  ok: true;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
} | {
  ok: false;
  status: 401 | 403;
  message: string;
};

const requireAdmin = async (): Promise<AdminCheckResult> => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {}
      }
    }
  );

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, status: 401, message: 'Not authenticated' };
  }

  const role = resolveRoleFromAppMetadata(user.app_metadata);
  if (role !== 'ADMIN') {
    return { ok: false, status: 403, message: 'Not authorized' };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email || null,
      name: user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null
    }
  };
};

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
      const adminResult = await requireAdmin();
      if (!adminResult.ok) {
        return NextResponse.json({ error: adminResult.message }, { status: adminResult.status });
      }
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
    const adminResult = await requireAdmin();
    if (!adminResult.ok) {
      return NextResponse.json({ error: adminResult.message }, { status: adminResult.status });
    }

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
        where: { id: adminResult.user.id },
        create: {
          id: adminResult.user.id,
          email: adminResult.user.email || `${adminResult.user.id}@local.invalid`,
          name: adminResult.user.name,
          avatarUrl: adminResult.user.avatarUrl,
          role: 'ADMIN'
        },
        update: {
          email: adminResult.user.email || `${adminResult.user.id}@local.invalid`,
          name: adminResult.user.name,
          avatarUrl: adminResult.user.avatarUrl,
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
          authorId: adminResult.user.id,
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
