import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  deleteBlogPostBySlug,
  getBlogPostBySlug,
  updateBlogPostBySlug,
} from '@/lib/services/blog-service';

const parsePrismaErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
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

    const post = await getBlogPostBySlug(params.slug);

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

    const existingPost = await getBlogPostBySlug(params.slug);

    if (!existingPost) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const parsedBody = updateBlogPostSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || 'Invalid request body' }, { status: 400 });
    }

    const updatedPost = await updateBlogPostBySlug(
      params.slug,
      {
        published: existingPost.published,
        publishedAt: existingPost.publishedAt,
      },
      parsedBody.data
    );
    if (!updatedPost.ok) {
      return NextResponse.json({ error: updatedPost.error }, { status: 400 });
    }

    return NextResponse.json(updatedPost.data);
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

    const post = await getBlogPostBySlug(params.slug);

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    await deleteBlogPostBySlug(params.slug);

    return NextResponse.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
