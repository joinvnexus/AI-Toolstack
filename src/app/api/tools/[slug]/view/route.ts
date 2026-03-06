import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { trackToolView } from '@/lib/services/tool-views-service';

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const cookieStore = await cookies();
    const existingVisitorId = cookieStore.get('toolstack_vid')?.value || '';
    const visitorId = existingVisitorId || randomUUID();

    const result = await trackToolView({
      slug: params.slug,
      visitorId,
      userAgent: request.headers.get('user-agent') || '',
      forwardedFor: request.headers.get('x-forwarded-for') || '',
    });

    if (result.status === 'not_found') {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const response = NextResponse.json({
      views: result.views,
      counted: result.status === 'counted',
    });

    if (!existingVisitorId) {
      response.cookies.set({
        name: 'toolstack_vid',
        value: visitorId,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (error) {
    console.error('Error tracking tool view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
