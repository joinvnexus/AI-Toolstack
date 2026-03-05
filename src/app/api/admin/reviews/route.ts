import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

const deleteReviewSchema = z.object({
  id: z.string().trim().min(1, 'Review ID is required'),
});

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(100, parsePositiveInt(searchParams.get('limit'), 50));

    const [reviews, total, distribution] = await Promise.all([
      prisma.review.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          tool: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count(),
      prisma.review.groupBy({
        by: ['rating'],
        _count: true,
      }),
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((item: { rating: number; _count: number }) => {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingDistribution[item.rating as keyof typeof ratingDistribution] = item._count;
      }
    });

    return NextResponse.json({
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      distribution: ratingDistribution,
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const parsedBody = deleteReviewSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || 'Invalid request body' }, { status: 400 });
    }
    const { id: reviewId } = parsedBody.data;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, toolId: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: review.id },
      });

      const aggregate = await tx.review.aggregate({
        where: { toolId: review.toolId },
        _avg: { rating: true },
        _count: { id: true },
      });

      await tx.tool.update({
        where: { id: review.toolId },
        data: {
          rating: aggregate._avg.rating ?? 0,
          reviewCount: aggregate._count.id,
        },
      });
    });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
