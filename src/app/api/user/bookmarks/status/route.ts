import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const bookmarkStatusQuerySchema = z.object({
  toolId: z.string().trim().min(1, 'Tool ID is required'),
});

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const parsedQuery = bookmarkStatusQuerySchema.safeParse({
      toolId: searchParams.get('toolId') || '',
    });

    if (!parsedQuery.success) {
      const firstIssue = parsedQuery.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || 'Invalid request query' },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId: parsedQuery.data.toolId,
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ isBookmarked: Boolean(bookmark) });
  } catch (error) {
    console.error('Error fetching bookmark status:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmark status' }, { status: 500 });
  }
}
