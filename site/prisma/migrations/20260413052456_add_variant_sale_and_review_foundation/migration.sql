-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN "originalPrice" REAL;
ALTER TABLE "ProductVariant" ADD COLUMN "stockQty" INTEGER;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Review_productId_enabled_sortOrder_idx" ON "Review"("productId", "enabled", "sortOrder");

-- CreateIndex
CREATE INDEX "Review_enabled_createdAt_idx" ON "Review"("enabled", "createdAt");
