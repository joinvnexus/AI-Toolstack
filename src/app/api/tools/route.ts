import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const pricing = searchParams.get('pricing');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
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

    const body = await request.json();
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
    } = body;

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const tool = await prisma.tool.create({
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
        pricingModel: pricingModel.toUpperCase(),
        priceRange,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    // Update category tool count
    await prisma.category.update({
      where: { id: categoryId },
      data: { toolCount: { increment: 1 } },
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
