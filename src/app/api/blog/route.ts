import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    const where: any = {
      published: true,
    };

    if (category) {
      where.categories = {
        some: {
          slug: category,
        },
      };
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          categories: true,
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const role = String(user.user_metadata?.role || 'USER').toUpperCase();
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, excerpt, featuredImage, categoryIds, published } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Calculate read time
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.ceil(words / wordsPerMinute);
    const shouldPublish = published === true;

    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email || `${user.id}@local.invalid`,
        name: user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
      update: {
        email: user.email || `${user.id}@local.invalid`,
        name: user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
    });

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        readTime,
        authorId: user.id,
        published: shouldPublish,
        publishedAt: shouldPublish ? new Date() : null,
        categories:
          Array.isArray(categoryIds) && categoryIds.length > 0
            ? {
                connect: categoryIds.map((id: string) => ({ id })),
              }
            : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        categories: true,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A post with the same slug already exists' },
          { status: 409 }
        );
      }

      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'One or more selected categories do not exist' },
          { status: 400 }
        );
      }
    }

    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
