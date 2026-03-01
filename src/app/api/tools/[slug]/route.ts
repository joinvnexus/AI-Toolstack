import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const tool = await prisma.tool.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        reviews: {
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
          take: 10,
        },
      },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.tool.update({
      where: { id: tool.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      longDescription,
      logoUrl,
      websiteUrl,
      affiliateUrl,
      pricingModel,
      priceRange,
      categoryId,
    } = body;

    const tool = await prisma.tool.update({
      where: { slug: params.slug },
      data: {
        name,
        description,
        longDescription: longDescription || description,
        logoUrl,
        websiteUrl,
        affiliateUrl,
        pricingModel: pricingModel.toUpperCase(),
        priceRange,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { error: 'Failed to update tool' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const tool = await prisma.tool.findUnique({
      where: { slug: params.slug },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    await prisma.tool.delete({
      where: { slug: params.slug },
    });

    // Update category tool count
    await prisma.category.update({
      where: { id: tool.categoryId },
      data: { toolCount: { decrement: 1 } },
    });

    return NextResponse.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { error: 'Failed to delete tool' },
      { status: 500 }
    );
  }
}
