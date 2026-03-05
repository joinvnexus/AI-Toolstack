import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const [totalTools, totalUsers, totalReviews, totalPosts, recentTools, recentUsers, recentReviews, recentPosts] = await Promise.all([
      prisma.tool.count(),
      prisma.user.count(),
      prisma.review.count(),
      prisma.blogPost.count(),
      prisma.tool.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          rating: true,
          createdAt: true,
          user: {
            select: {
              email: true,
            },
          },
          tool: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
          createdAt: true,
        },
      }),
    ]);

    const recentActivity = [
      ...recentTools.map((tool) => ({
        id: `tool-${tool.id}`,
        type: 'TOOL' as const,
        title: 'New tool added',
        description: tool.name,
        createdAt: tool.createdAt,
        href: `/admin/tools/${tool.slug}/edit`,
      })),
      ...recentUsers.map((account) => ({
        id: `user-${account.id}`,
        type: 'USER' as const,
        title: 'New user joined',
        description: account.email,
        createdAt: account.createdAt,
        href: '/admin/users',
      })),
      ...recentReviews.map((review) => ({
        id: `review-${review.id}`,
        type: 'REVIEW' as const,
        title: 'New review submitted',
        description: `${review.user.email} rated ${review.tool.name} ${review.rating}/5`,
        createdAt: review.createdAt,
        href: '/admin/reviews',
      })),
      ...recentPosts.map((post) => ({
        id: `post-${post.id}`,
        type: 'POST' as const,
        title: post.published ? 'Blog post published' : 'Blog post drafted',
        description: post.title,
        createdAt: post.createdAt,
        href: `/admin/posts/${post.slug}/edit`,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8);

    return NextResponse.json({
      totalTools,
      totalUsers,
      totalReviews,
      totalPosts,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
