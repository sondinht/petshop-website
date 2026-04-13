CREATE TABLE "ProductPlacement" (
    "productId" TEXT NOT NULL,
    "storefrontPage" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("productId", "storefrontPage"),
    CONSTRAINT "ProductPlacement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ProductPlacement_storefrontPage_idx" ON "ProductPlacement"("storefrontPage");

INSERT INTO "ProductPlacement" ("productId", "storefrontPage")
SELECT
    p."id",
    CASE
        WHEN lower(trim(p."category")) LIKE '%dog%' THEN 'dogs'
        WHEN lower(trim(p."category")) LIKE '%cat%' THEN 'cats'
        WHEN lower(trim(p."category")) LIKE '%access%' THEN 'accessories'
        WHEN lower(trim(p."category")) LIKE '%deal%' OR lower(trim(p."category")) LIKE '%sale%' THEN 'deals'
        WHEN lower(trim(p."category")) = 'dogs' THEN 'dogs'
        WHEN lower(trim(p."category")) = 'cats' THEN 'cats'
        WHEN lower(trim(p."category")) = 'accessories' THEN 'accessories'
        WHEN lower(trim(p."category")) = 'deals' THEN 'deals'
        ELSE 'dogs'
    END
FROM "Product" p;
