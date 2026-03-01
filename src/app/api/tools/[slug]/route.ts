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
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        screenshots: true,
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

    const tool = await prisma.tool.findUnique({
      where: { slug: params.slug },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // If category changed, update counts
    if (categoryId && categoryId !== tool.categoryId) {
      await prisma.category.update({
        where: { id: tool.categoryId },
        data: { toolCount: { decrement: 1 } },
      });
      await prisma.category.update({
        where: { id: categoryId },
        data: { toolCount: { increment: 1 } },
      });
    }

    const updatedTool = await prisma.tool.update({
      where: { id: tool.id },
      data: {
        name: name || tool.name,
        description: description || tool.description,
        longDescription: longDescription || tool.longDescription,
        logoUrl: logoUrl || tool.logoUrl,
        websiteUrl: websiteUrl || tool.websiteUrl,
        affiliateUrl: affiliateUrl !== undefined ? affiliateUrl : tool.affiliateUrl,
        pricingModel: pricingModel ? pricingModel.toUpperCase() : tool.pricingModel,
        priceRange: priceRange !== undefined ? priceRange : tool.priceRange,
        categoryId: categoryId || tool.categoryId,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updatedTool);
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

    // Update category tool count
    await prisma.category.update({
      where: { id: tool.categoryId },
      data: { toolCount: { decrement: 1 } },
    });

    // Delete related records first
    await prisma.review.deleteMany({
      where: { toolId: tool.id },
    });

    await prisma.bookmark.deleteMany({
      where: { toolId: tool.id },
    });

    await prisma.screenshot.deleteMany({
      where: { toolId: tool.id },
    });

    // Delete the tool
    await prisma.tool.delete({
      where: { id: tool.id },
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
