import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  content: z.string().trim().min(1, 'Review content is required'),
});

const ensurePrismaUser = async (user: {
  id: string;
  email?: string | null;
  user_metadata?: { name?: string; avatar_url?: string };
  app_metadata?: Record<string, unknown>;
}) => {
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email || `${user.id}@local.invalid`,
      name: user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      role: resolveRoleFromAppMetadata(user.app_metadata),
    },
    update: {
      email: user.email || `${user.id}@local.invalid`,
      name: user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      role: resolveRoleFromAppMetadata(user.app_metadata),
    },
  });
};

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const tool = await prisma.tool.findUnique({
      where: { slug: params.slug },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { toolId: tool.id },
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
      prisma.review.count({ where: { toolId: tool.id } }),
    ]);

    // Calculate rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { toolId: tool.id },
      _count: true,
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((item: { rating: number; _count: number }) => {
      distribution[item.rating as keyof typeof distribution] = item._count;
    });

    return NextResponse.json({
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      distribution,
      averageRating: tool.rating,
      reviewCount: tool.reviewCount,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await ensurePrismaUser(user);

    const tool = await prisma.tool.findUnique({
      where: { slug: params.slug },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this tool
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId: tool.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this tool' },
        { status: 400 }
      );
    }

    const parsedBody = createReviewSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || 'Invalid request body' }, { status: 400 });
    }
    const { rating, content } = parsedBody.data;

    const review = await prisma.review.create({
      data: {
        rating,
        content,
        userId: user.id,
        toolId: tool.id,
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

    // Update tool rating after insert
    const aggregate = await prisma.review.aggregate({
      where: { toolId: tool.id },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        rating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.id,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
