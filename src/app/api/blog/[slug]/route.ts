import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

const requireAdmin = async (): Promise<{ ok: true } | { ok: false; status: 401 | 403; message: string }> => {
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

  return { ok: true };
};

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
      if (!adminResult.ok) {
        return NextResponse.json({ error: adminResult.message }, { status: adminResult.status });
      }
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
    if (!adminResult.ok) {
      return NextResponse.json({ error: adminResult.message }, { status: adminResult.status });
    }

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: params.slug }
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : undefined;
    const content = typeof body.content === 'string' ? body.content.trim() : undefined;
    const excerpt = typeof body.excerpt === 'string' ? body.excerpt.trim() : undefined;
    const featuredImage = typeof body.featuredImage === 'string' ? body.featuredImage.trim() : undefined;
    const slugInput = typeof body.slug === 'string' ? body.slug : undefined;
    const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : undefined;
    const publishedProvided = typeof body.published === 'boolean';

    const nextSlug = slugInput !== undefined ? slugify(slugInput) : undefined;
    if (slugInput !== undefined && !nextSlug) {
      return NextResponse.json({ error: 'Slug is invalid' }, { status: 400 });
    }

    let nextPublishedAt = existingPost.publishedAt;
    if (publishedProvided) {
      if (body.published === true && !existingPost.published) {
        nextPublishedAt = new Date();
      }
      if (body.published === false) {
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
        published: publishedProvided ? body.published : undefined,
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
    if (!adminResult.ok) {
      return NextResponse.json({ error: adminResult.message }, { status: adminResult.status });
    }

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
