CREATE TABLE "ProductCollectionMembership" (
    "productId" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("productId", "collection"),
    CONSTRAINT "ProductCollectionMembership_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProductCollectionMembership_collection_idx" ON "ProductCollectionMembership"("collection");

CREATE TABLE "FlashSaleCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "FlashSaleCampaign_isActive_startAt_endAt_idx" ON "FlashSaleCampaign"("isActive", "startAt", "endAt");
