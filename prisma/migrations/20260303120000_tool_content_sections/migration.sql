-- AlterTable
ALTER TABLE "Tool"
ADD COLUMN     "overview" TEXT,
ADD COLUMN     "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pros" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "cons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pricingDetails" TEXT,
ADD COLUMN     "alternativeTools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "conclusion" TEXT;
