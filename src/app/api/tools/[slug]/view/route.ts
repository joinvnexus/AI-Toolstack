import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const existingTool = await prisma.tool.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!existingTool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    const updatedTool = await prisma.tool.update({
      where: { id: existingTool.id },
      data: { views: { increment: 1 } },
      select: { views: true },
    });

    return NextResponse.json({ views: updatedTool.views });
  } catch (error) {
    console.error('Error tracking tool view:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
