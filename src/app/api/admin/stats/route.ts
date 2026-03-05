import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { resolveRoleFromAppMetadata } from '@/lib/auth/role';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const role = resolveRoleFromAppMetadata(user.app_metadata);
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

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
