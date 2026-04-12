ALTER TABLE "Product" ADD COLUMN "publicId" TEXT;

CREATE UNIQUE INDEX "Product_publicId_key" ON "Product"("publicId");
