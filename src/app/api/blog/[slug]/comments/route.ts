import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { syncUserFromAuth } from '@/lib/auth/sync-user';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, 'Comment must be at least 2 characters')
    .max(2000, 'Comment is too long'),
});

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: params.slug },
      select: { id: true, published: true },
    });

    if (!post || !post.published) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(100, parsePositiveInt(searchParams.get('limit'), 20));

    const [comments, total] = await Promise.all([
      prisma.blogComment.findMany({
        where: { blogPostId: post.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogComment.count({
        where: { blogPostId: post.id },
      }),
    ]);

    return NextResponse.json({
      data: comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching blog comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await syncUserFromAuth(user);

    const post = await prisma.blogPost.findUnique({
      where: { slug: params.slug },
      select: { id: true, published: true },
    });

    if (!post || !post.published) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const parsedBody = createCommentSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || 'Invalid request body' }, { status: 400 });
    }

    const comment = await prisma.blogComment.create({
      data: {
        content: parsedBody.data.content,
        userId: user.id,
        blogPostId: post.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating blog comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
