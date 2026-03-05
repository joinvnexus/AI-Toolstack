import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

const updateToolSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').optional(),
  description: z.string().trim().min(1, 'Description is required').optional(),
  longDescription: z.string().optional(),
  overview: z.string().optional(),
  features: z.array(z.string()).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  pricingDetails: z.string().optional(),
  alternativeTools: z.array(z.string()).optional(),
  videoUrl: z.string().url('Video URL must be valid').optional(),
  conclusion: z.string().optional(),
  logoUrl: z.string().url('Logo URL must be valid').optional(),
  websiteUrl: z.string().url('Website URL must be valid').optional(),
  affiliateUrl: z.string().url('Affiliate URL must be valid').optional(),
  pricingModel: z.enum(['FREE', 'PAID', 'FREEMIUM']).optional(),
  priceRange: z.string().optional(),
  categoryId: z.string().trim().min(1, 'Category is required').optional(),
});

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
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const parsedBody = updateToolSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0];
      return NextResponse.json({ error: firstIssue?.message || 'Invalid request body' }, { status: 400 });
    }

    const {
      name,
      description,
      longDescription,
      overview,
      features,
      pros,
      cons,
      pricingDetails,
      alternativeTools,
      videoUrl,
      conclusion,
      logoUrl,
      websiteUrl,
      affiliateUrl,
      pricingModel,
      priceRange,
      categoryId,
    } = parsedBody.data;

    const tool = await prisma.tool.findUnique({
      where: { slug: params.slug },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    const updatedTool = await prisma.$transaction(async (tx) => {
      if (categoryId && categoryId !== tool.categoryId) {
        await tx.category.update({
          where: { id: tool.categoryId },
          data: { toolCount: { decrement: 1 } },
        });
        await tx.category.update({
          where: { id: categoryId },
          data: { toolCount: { increment: 1 } },
        });
      }

      return tx.tool.update({
        where: { id: tool.id },
        data: {
          name: name || tool.name,
          description: description || tool.description,
          longDescription: longDescription || tool.longDescription,
          overview: overview !== undefined ? overview?.trim() || null : tool.overview,
          features: features !== undefined ? normalizeStringArray(features) : tool.features,
          pros: pros !== undefined ? normalizeStringArray(pros) : tool.pros,
          cons: cons !== undefined ? normalizeStringArray(cons) : tool.cons,
          pricingDetails:
            pricingDetails !== undefined ? pricingDetails?.trim() || null : tool.pricingDetails,
          alternativeTools:
            alternativeTools !== undefined
              ? normalizeStringArray(alternativeTools)
              : tool.alternativeTools,
          videoUrl: videoUrl !== undefined ? videoUrl?.trim() || null : tool.videoUrl,
          conclusion: conclusion !== undefined ? conclusion?.trim() || null : tool.conclusion,
          logoUrl: logoUrl || tool.logoUrl,
          websiteUrl: websiteUrl || tool.websiteUrl,
          affiliateUrl: affiliateUrl !== undefined ? affiliateUrl : tool.affiliateUrl,
          pricingModel: pricingModel ?? tool.pricingModel,
          priceRange: priceRange !== undefined ? priceRange : tool.priceRange,
          categoryId: categoryId || tool.categoryId,
        },
        include: {
          category: true,
        },
      });
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
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const tool = await prisma.tool.findUnique({
      where: { slug: params.slug },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: tool.categoryId },
        data: { toolCount: { decrement: 1 } },
      });

      await tx.review.deleteMany({
        where: { toolId: tool.id },
      });

      await tx.bookmark.deleteMany({
        where: { toolId: tool.id },
      });

      await tx.screenshot.deleteMany({
        where: { toolId: tool.id },
      });

      await tx.tool.delete({
        where: { id: tool.id },
      });
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
