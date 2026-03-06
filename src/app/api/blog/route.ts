import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createBlogPost, listBlogPosts } from '@/lib/services/blog-service';

const parsePrismaErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
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

    const result = await listBlogPosts({
      page,
      limit,
      category,
      search,
      sort,
      includeDrafts,
    });

    return NextResponse.json(result);
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
    const post = await createBlogPost(parsedBody.data, admin.user);
    if (!post.ok) {
      return NextResponse.json({ error: post.error }, { status: 400 });
    }

    return NextResponse.json(post.data, { status: 201 });
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
