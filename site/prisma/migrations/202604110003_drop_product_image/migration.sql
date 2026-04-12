PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "brand" TEXT,
    "stockQty" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Product" (
    "id",
    "publicId",
    "name",
    "price",
    "category",
    "sku",
    "description",
    "brand",
    "stockQty",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "publicId",
    "name",
    "price",
    "category",
    "sku",
    "description",
    "brand",
    "stockQty",
    "createdAt",
    "updatedAt"
FROM "Product";

DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";

CREATE UNIQUE INDEX "Product_publicId_key" ON "Product"("publicId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
