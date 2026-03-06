-- CreateTable
CREATE TABLE "ToolViewEvent" (
    "id" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bucketStart" TIMESTAMP(3) NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,

    CONSTRAINT "ToolViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ToolViewEvent_toolId_visitorHash_bucketStart_key" ON "ToolViewEvent"("toolId", "visitorHash", "bucketStart");

-- CreateIndex
CREATE INDEX "ToolViewEvent_toolId_viewedAt_idx" ON "ToolViewEvent"("toolId", "viewedAt");

-- AddForeignKey
ALTER TABLE "ToolViewEvent" ADD CONSTRAINT "ToolViewEvent_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
