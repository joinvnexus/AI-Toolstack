import { createHash } from 'crypto';
import prisma from '@/lib/prisma';

const parsePrismaErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

const createHourlyBucket = (date: Date): Date => {
  const bucket = new Date(date);
  bucket.setMinutes(0, 0, 0);
  return bucket;
};

const hashVisitorKey = (value: string): string => {
  return createHash('sha256').update(value).digest('hex');
};

type TrackToolViewInput = {
  slug: string;
  visitorId: string;
  userAgent: string;
  forwardedFor: string;
};

type TrackToolViewResult =
  | { status: 'not_found' }
  | { status: 'counted'; views: number }
  | { status: 'duplicate'; views: number };

export const trackToolView = async ({
  slug,
  visitorId,
  userAgent,
  forwardedFor,
}: TrackToolViewInput): Promise<TrackToolViewResult> => {
  const tool = await prisma.tool.findUnique({
    where: { slug },
    select: { id: true, views: true },
  });

  if (!tool) {
    return { status: 'not_found' };
  }

  const now = new Date();
  const bucketStart = createHourlyBucket(now);
  const visitorHash = hashVisitorKey(
    `${visitorId}|${userAgent.trim().toLowerCase()}|${forwardedFor.trim().toLowerCase()}`
  );

  try {
    const updatedTool = await prisma.$transaction(async (tx) => {
      await tx.toolViewEvent.create({
        data: {
          toolId: tool.id,
          visitorHash,
          bucketStart,
          viewedAt: now,
        },
      });

      return tx.tool.update({
        where: { id: tool.id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });
    });

    return { status: 'counted', views: updatedTool.views };
  } catch (error) {
    const errorCode = parsePrismaErrorCode(error);

    if (errorCode === 'P2002') {
      const latestTool = await prisma.tool.findUnique({
        where: { id: tool.id },
        select: { views: true },
      });

      return { status: 'duplicate', views: latestTool?.views ?? tool.views };
    }

    if (errorCode === 'P2021') {
      // Fallback for environments where the analytics table migration is not applied yet.
      const updatedTool = await prisma.tool.update({
        where: { id: tool.id },
        data: { views: { increment: 1 } },
        select: { views: true },
      });

      return { status: 'counted', views: updatedTool.views };
    }

    throw error;
  }
};
