import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { seedProducts } from "./seedData/products";
import { productReviewsByName, storeFallbackReviews } from "./seedData/reviews";
import { storefrontPageFromCategory } from "../src/server/productTypes";

const prisma = new PrismaClient();

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }

  return value;
}

function optionalEnv(name: string): string | null {
  const value = process.env[name];

  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

async function main() {
  const existingIds = await prisma.product.findMany({
    select: { id: true }
  });
  const hasLegacyProductIds = existingIds.some((row) => !UUID_RE.test(row.id));

  if (hasLegacyProductIds) {
    console.warn(
      "Detected non-UUID product ids in local DB. Seeding will keep existing ids for matching names. For UUID-only dev data, run: npm run prisma:reset"
    );
  }

  const seededProductIds: string[] = [];
  const seededProductsByName = new Map<string, string>();

  for (const product of seedProducts) {
    const normalizedImages = Array.from(
      new Set(
        (Array.isArray(product.images) ? product.images : [product.image])
          .map((image) => (typeof image === "string" ? image.trim() : ""))
          .filter((image) => image.length > 0)
      )
    );
    const orderedImages = normalizedImages.length > 0 ? normalizedImages : [FALLBACK_IMAGE];
    const storefrontPages = Array.from(
      new Set(
        (Array.isArray(product.storefrontPages) && product.storefrontPages.length > 0
          ? product.storefrontPages
          : [storefrontPageFromCategory(product.category) || "dogs"])
            .map((page) => String(page || "").trim().toLowerCase())
            .filter(Boolean)
      )
    );

    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name },
      select: { id: true }
    });
    const nextProductId = existingProduct?.id ?? randomUUID();

    const savedProduct = await prisma.product.upsert({
      where: { id: nextProductId },
      create: {
        id: nextProductId,
        name: product.name,
        price: product.price,
        category: product.category,
        dogLifeStage: product.dogLifeStage ?? null,
        dogBreedSize: product.dogBreedSize ?? null,
        catAge: product.catAge ?? null,
        catType: product.catType ?? null
      },
      update: {
        name: product.name,
        price: product.price,
        category: product.category,
        dogLifeStage: product.dogLifeStage ?? null,
        dogBreedSize: product.dogBreedSize ?? null,
        catAge: product.catAge ?? null,
        catType: product.catType ?? null
      }
    });

    seededProductIds.push(savedProduct.id);
    seededProductsByName.set(savedProduct.name, savedProduct.id);

    await prisma.productImage.deleteMany({
      where: { productId: savedProduct.id }
    });

    await prisma.productImage.createMany({
      data: orderedImages.map((url, index) => ({
        productId: savedProduct.id,
        url,
        alt: product.name,
        sortOrder: index
      }))
    });

    await prisma.productVariant.deleteMany({
      where: { productId: savedProduct.id }
    });

    const normalizedVariants = (Array.isArray(product.variants) ? product.variants : [])
      .map((variant, index) => ({
        name: String(variant?.name || "").trim(),
        price: Number(variant?.price),
        originalPrice:
          variant?.originalPrice === null || variant?.originalPrice === undefined
            ? null
            : Number(variant.originalPrice),
        stockQty:
          variant?.stockQty === null || variant?.stockQty === undefined
            ? null
            : Number(variant.stockQty),
        enabled: variant?.enabled !== false,
        sortOrder:
          Number.isInteger(variant?.sortOrder) && Number(variant.sortOrder) >= 0
            ? Number(variant.sortOrder)
            : index
      }))
      .filter((variant) => variant.name.length > 0 && Number.isFinite(variant.price) && variant.price >= 0)
      .map((variant) => ({
        ...variant,
        originalPrice:
          Number.isFinite(variant.originalPrice) && (variant.originalPrice as number) >= variant.price
            ? (variant.originalPrice as number)
            : null,
        stockQty:
          Number.isInteger(variant.stockQty) && (variant.stockQty as number) >= 0
            ? (variant.stockQty as number)
            : null
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder);

    if (normalizedVariants.length > 0) {
      await prisma.productVariant.createMany({
        data: normalizedVariants.map((variant) => ({
          productId: savedProduct.id,
          name: variant.name,
          price: variant.price,
          originalPrice: variant.originalPrice,
          stockQty: variant.stockQty,
          enabled: variant.enabled,
          sortOrder: variant.sortOrder
        }))
      });
    }

    await prisma.$executeRaw`
      DELETE FROM "ProductPlacement"
      WHERE "productId" = ${savedProduct.id}
    `;

    for (const storefrontPage of storefrontPages) {
      await prisma.$executeRaw`
        INSERT INTO "ProductPlacement" ("productId", "storefrontPage")
        VALUES (${savedProduct.id}, ${storefrontPage})
      `;
    }

    await prisma.$executeRaw`
      DELETE FROM "ProductCollectionMembership"
      WHERE "productId" = ${savedProduct.id}
    `;

    if (storefrontPages.includes("deals")) {
      await prisma.$executeRaw`
        INSERT INTO "ProductCollectionMembership" ("productId", "collection")
        VALUES (${savedProduct.id}, ${"FLASH_SALE"})
      `;
    }
  }

  const bestSellerSeedIds = seededProductIds.slice(0, 4);
  for (const productId of bestSellerSeedIds) {
    await prisma.$executeRaw`
      INSERT INTO "ProductCollectionMembership" ("productId", "collection")
      VALUES (${productId}, ${"BEST_SELLERS"})
      ON CONFLICT ("productId", "collection") DO NOTHING
    `;
  }

  await prisma.review.deleteMany({
    where: {
      OR: [{ productId: null }, { productId: { in: seededProductIds } }]
    }
  });

  for (const [productName, reviews] of Object.entries(productReviewsByName)) {
    const productId = seededProductsByName.get(productName);

    if (!productId || !Array.isArray(reviews) || reviews.length === 0) {
      continue;
    }

    await prisma.review.createMany({
      data: reviews.map((review, index) => ({
        productId,
        rating: Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0))),
        title: String(review.title || "").trim() || null,
        body: String(review.body || "").trim(),
        authorName: String(review.authorName || "Anonymous").trim() || "Anonymous",
        enabled: true,
        sortOrder: index
      }))
    });
  }

  if (storeFallbackReviews.length > 0) {
    await prisma.review.createMany({
      data: storeFallbackReviews.map((review, index) => ({
        productId: null,
        rating: Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0))),
        title: String(review.title || "").trim() || null,
        body: String(review.body || "").trim(),
        authorName: String(review.authorName || "Anonymous").trim() || "Anonymous",
        enabled: true,
        sortOrder: index
      }))
    });
  }

  await prisma.flashSaleCampaign.updateMany({ data: { isActive: false } });
  await prisma.flashSaleCampaign.create({
    data: {
      name: "Weekend Paws",
      startAt: new Date(Date.now() - 60 * 60 * 1000),
      endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      discountType: "PERCENTAGE",
      discountValue: 20,
      isActive: true
    }
  });

  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" }
  });

  if (adminCount === 0) {
    const adminEmail = requireEnv("ADMIN_SEED_EMAIL").trim().toLowerCase();
    const adminPassword = requireEnv("ADMIN_SEED_PASSWORD");
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        status: "ENABLED"
      },
      update: {
        passwordHash,
        role: "ADMIN",
        status: "ENABLED"
      }
    });
  } else {
    const adminEmail = optionalEnv("ADMIN_SEED_EMAIL");

    if (adminEmail) {
      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail.toLowerCase() },
        select: { role: true }
      });

      if (existingAdmin?.role !== "ADMIN") {
        console.warn("ADMIN_SEED_EMAIL is set but initial admin bootstrap was skipped (admin already exists).");
      }
    }
  }
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
