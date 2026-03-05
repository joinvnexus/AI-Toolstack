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

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const createToolSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().min(1, 'Description is required'),
  longDescription: z.string().optional(),
  overview: z.string().optional(),
  features: z.array(z.string()).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  pricingDetails: z.string().optional(),
  alternativeTools: z.array(z.string()).optional(),
  videoUrl: z.string().url('Video URL must be valid').optional(),
  conclusion: z.string().optional(),
  logoUrl: z.string().url('Logo URL must be valid'),
  websiteUrl: z.string().url('Website URL must be valid'),
  affiliateUrl: z.string().url('Affiliate URL must be valid').optional(),
  pricingModel: z.enum(['FREE', 'PAID', 'FREEMIUM']),
  priceRange: z.string().optional(),
  categoryId: z.string().trim().min(1, 'Category is required'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(100, parsePositiveInt(searchParams.get('limit'), 12));
    const category = searchParams.get('category');
    const pricing = searchParams.get('pricing');
    const parsedMinRating = Number.parseFloat(searchParams.get('minRating') || '0');
    const minRating = Number.isFinite(parsedMinRating) ? parsedMinRating : 0;
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'rating';

    const where: any = {};

    if (category && category !== 'All') {
      where.category = { slug: category };
    }

    if (pricing && pricing !== 'All') {
      where.pricingModel = pricing.toUpperCase();
    }

    if (minRating > 0) {
      where.rating = { gte: minRating };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { rating: 'desc' };
    if (sort === 'reviews') {
      orderBy = { reviewCount: 'desc' };
    } else if (sort === 'name') {
      orderBy = { name: 'asc' };
    }

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: {
          category: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tool.count({ where }),
    ]);

    return NextResponse.json({
      data: tools,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const parsedBody = createToolSchema.safeParse(await request.json());
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

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const tool = await prisma.$transaction(async (tx) => {
      const createdTool = await tx.tool.create({
        data: {
          name,
          slug,
          description,
          longDescription: longDescription || description,
          overview: overview?.trim() || null,
          features: normalizeStringArray(features),
          pros: normalizeStringArray(pros),
          cons: normalizeStringArray(cons),
          pricingDetails: pricingDetails?.trim() || null,
          alternativeTools: normalizeStringArray(alternativeTools),
          videoUrl: videoUrl?.trim() || null,
          conclusion: conclusion?.trim() || null,
          logoUrl,
          websiteUrl,
          affiliateUrl,
          pricingModel,
          priceRange,
          categoryId,
        },
        include: {
          category: true,
        },
      });

      await tx.category.update({
        where: { id: categoryId },
        data: { toolCount: { increment: 1 } },
      });

      return createdTool;
    });

    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 }
    );
  }
}
