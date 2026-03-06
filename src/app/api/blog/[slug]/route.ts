import { NextResponse } from 'next/server';
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

const updateBlogPostSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').optional(),
  content: z.string().trim().min(1, 'Content is required').optional(),
  excerpt: z.string().optional(),
  featuredImage: z.string().url('Featured image URL must be valid').optional(),
  slug: z.string().optional(),
  categoryIds: z.array(z.string().trim().min(1)).optional(),
  published: z.boolean().optional(),
});

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDraft = ['1', 'true', 'yes'].includes(
      (searchParams.get('preview') || searchParams.get('includeDraft') || '').toLowerCase()
    );

    const post = await prisma.blogPost.findUnique({
      where: { slug: params.slug },
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

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    if (!post.published) {
      if (!includeDraft) {
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
      }

      const adminResult = await requireAdmin();
      if (!adminResult.ok) return adminResult.response;
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { slug: string } }) {
  try {
    const adminResult = await requireAdmin();
    if (!adminResult.ok) return adminResult.response;

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: params.slug }
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const parsedBody = updateBlogPostSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || 'Invalid request body' }, { status: 400 });
    }

    const { title, content, excerpt, featuredImage, slug: slugInput, categoryIds, published } = parsedBody.data;
    const publishedProvided = typeof published === 'boolean';

    const nextSlug = slugInput !== undefined ? slugify(slugInput) : undefined;
    if (slugInput !== undefined && !nextSlug) {
      return NextResponse.json({ error: 'Slug is invalid' }, { status: 400 });
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
      where: { slug: params.slug },
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
                set: categoryIds.map((id: string) => ({ id }))
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

    return NextResponse.json(updatedPost);
  } catch (error) {
    const errorCode = parsePrismaErrorCode(error);
    if (errorCode === 'P2002') {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 });
    }

    if (errorCode === 'P2025') {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const adminResult = await requireAdmin();
    if (!adminResult.ok) return adminResult.response;

    const post = await prisma.blogPost.findUnique({
      where: { slug: params.slug }
    });

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { slug: params.slug }
    });

    return NextResponse.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
