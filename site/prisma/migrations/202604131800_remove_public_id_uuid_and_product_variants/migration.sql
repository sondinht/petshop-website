PRAGMA foreign_keys=OFF;

-- Drop Product.publicId and keep existing Product ids/data.
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sku" TEXT,
    "description" TEXT,
    "brand" TEXT,
    "stockQty" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" (
    "id",
    "name",
    "price",
    "category",
    "enabled",
    "sku",
    "description",
    "brand",
    "stockQty",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "name",
    "price",
    "category",
    "enabled",
    "sku",
    "description",
    "brand",
    "stockQty",
    "createdAt",
    "updatedAt"
FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";

-- Add product variants.
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProductVariant_productId_sortOrder_idx" ON "ProductVariant"("productId", "sortOrder");
CREATE INDEX "ProductVariant_productId_enabled_sortOrder_idx" ON "ProductVariant"("productId", "enabled", "sortOrder");

-- Extend CartItem for variant selection and per-line unit price snapshot.
CREATE TABLE "new_CartItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cartSessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "variantName" TEXT,
    "unitPrice" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CartItem_cartSessionId_fkey" FOREIGN KEY ("cartSessionId") REFERENCES "Cart" ("sessionId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CartItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CartItem" (
    "id",
    "cartSessionId",
    "productId",
    "quantity",
    "createdAt",
    "updatedAt",
    "unitPrice"
)
SELECT
    "CartItem"."id",
    "CartItem"."cartSessionId",
    "CartItem"."productId",
    "CartItem"."quantity",
    "CartItem"."createdAt",
    "CartItem"."updatedAt",
    "Product"."price"
FROM "CartItem"
JOIN "Product" ON "Product"."id" = "CartItem"."productId";
DROP TABLE "CartItem";
ALTER TABLE "new_CartItem" RENAME TO "CartItem";
CREATE INDEX "CartItem_cartSessionId_idx" ON "CartItem"("cartSessionId");
CREATE INDEX "CartItem_cartSessionId_productId_productVariantId_idx" ON "CartItem"("cartSessionId", "productId", "productVariantId");

-- Extend OrderItem to snapshot selected variant.
CREATE TABLE "new_OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "variantName" TEXT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" (
    "id",
    "orderId",
    "productId",
    "name",
    "price",
    "quantity"
)
SELECT
    "id",
    "orderId",
    "productId",
    "name",
    "price",
    "quantity"
FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
