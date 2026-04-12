import { randomUUID } from "node:crypto";
import { isProductCategory } from "./productTypes";
import { prisma } from "./db/prisma";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80";

export type AdminProductInput = {
  name: string;
  price: number;
  category: string;
  images?: string[];
  image?: string | null;
  publicId?: string | null;
  sku?: string | null;
  description?: string | null;
  brand?: string | null;
  stockQty?: number | null;
};

export type AdminProductPatchInput = Partial<AdminProductInput>;

function toPublicIdBase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeImageUrls(urls: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const url of urls) {
    if (typeof url !== "string") {
      continue;
    }

    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

function resolveInputImages(input: { images?: string[]; image?: string | null }) {
  const normalized = normalizeImageUrls([
    ...(Array.isArray(input.images) ? input.images : []),
    input.image ?? null
  ]);

  return normalized.length > 0 ? normalized : [FALLBACK_IMAGE];
}

function toProductView<T extends { images: Array<{ url: string; sortOrder: number }> }>(product: T) {
  const orderedImages = [...product.images]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image) => image.url);
  const primaryImage = orderedImages[0] ?? FALLBACK_IMAGE;

  return {
    ...product,
    image: primaryImage,
    images: orderedImages
  };
}

export async function listProducts(category?: string) {
  if (category && !isProductCategory(category)) {
    throw new Error("INVALID_PRODUCT_CATEGORY");
  }

  const products = await prisma.product.findMany({
    where: category ? { category } : undefined,
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return products.map(toProductView);
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return product ? toProductView(product) : null;
}

export async function listAdminProducts() {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return products.map(toProductView);
}

export async function createProduct(input: AdminProductInput) {
  const id = randomUUID();
  const publicIdBase = input.publicId ? toPublicIdBase(input.publicId) : toPublicIdBase(input.name);
  const publicId = publicIdBase ? `${publicIdBase}-${id.slice(0, 8)}` : id;
  const images = resolveInputImages(input);

  const product = await prisma.product.create({
    data: {
      id,
      publicId,
      name: input.name,
      price: input.price,
      category: input.category,
      sku: input.sku ?? null,
      description: input.description ?? null,
      brand: input.brand ?? null,
      stockQty: input.stockQty ?? null,
      images: {
        create: images.map((url, index) => ({
          url,
          alt: input.name,
          sortOrder: index
        }))
      }
    },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return toProductView(product);
}

export async function patchProduct(productId: string, input: AdminProductPatchInput) {
  return prisma.$transaction(async (tx) => {
    const nextImages =
      "images" in input || "image" in input
        ? resolveInputImages({ images: input.images, image: input.image ?? null })
        : null;

    const product = await tx.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        price: input.price,
        category: input.category,
        sku: input.sku,
        description: input.description,
        brand: input.brand,
        stockQty: input.stockQty
      }
    });

    if (nextImages) {
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.createMany({
        data: nextImages.map((url, index) => ({
          productId,
          url,
          alt: input.name ?? product.name,
          sortOrder: index
        }))
      });
    } else if (typeof input.name === "string" && input.name.trim()) {
      await tx.productImage.updateMany({
        where: { productId },
        data: { alt: input.name.trim() }
      });
    }

    const hydratedProduct = await tx.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }
      }
    });

    if (!hydratedProduct) {
      throw new Error("PRODUCT_NOT_FOUND_AFTER_PATCH");
    }

    return toProductView(hydratedProduct);
  });
}

export async function deleteProduct(productId: string) {
  return prisma.product.delete({
    where: { id: productId }
  });
}
