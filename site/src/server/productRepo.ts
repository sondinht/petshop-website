import { randomUUID } from "node:crypto";
import {
  isProductCollection,
  type ProductCollection,
  isProductCategory,
  isStorefrontPage,
  storefrontPageFromCategory,
  STOREFRONT_PAGES,
  type StorefrontPage
} from "./productTypes";
import { prisma } from "./db/prisma";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80";

export type AdminProductVariantInput = {
  id?: string | null;
  name: string;
  price: number;
  originalPrice?: number | null;
  stockQty?: number | null;
  enabled?: boolean;
  sortOrder?: number | null;
};

export type AdminProductInput = {
  name: string;
  price?: number;
  category: string;
  enabled?: boolean;
  storefrontPages?: string[];
  images?: string[];
  image?: string | null;
  sku?: string | null;
  description?: string | null;
  brand?: string | null;
  stockQty?: number | null;
  flashSaleEligible?: boolean;
  bestSeller?: boolean;
  variants?: AdminProductVariantInput[];
};

export type AdminProductPatchInput = Partial<AdminProductInput>;

type NormalizedProductVariant = {
  id?: string | null;
  name: string;
  price: number;
  originalPrice: number | null;
  stockQty: number | null;
  enabled: boolean;
  sortOrder: number;
};

function normalizeVariantOriginalPrice(price: number, originalPrice: unknown): number | null {
  if (originalPrice === null || originalPrice === undefined || originalPrice === "") {
    return null;
  }

  const normalized = Number(originalPrice);
  return Number.isFinite(normalized) && normalized >= price ? normalized : null;
}

function normalizeVariantStockQty(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized >= 0 ? normalized : null;
}

function buildSaleDisplay(currentPrice: number, originalPrice: number | null) {
  if (!Number.isFinite(currentPrice) || currentPrice < 0) {
    return {
      currentPrice: 0,
      originalPrice: null,
      percentOff: 0,
      isOnSale: false
    };
  }

  if (!Number.isFinite(originalPrice) || (originalPrice as number) <= currentPrice) {
    return {
      currentPrice,
      originalPrice: null,
      percentOff: 0,
      isOnSale: false
    };
  }

  const normalizedOriginal = originalPrice as number;
  const percentOff = Math.round(((normalizedOriginal - currentPrice) / normalizedOriginal) * 100);

  return {
    currentPrice,
    originalPrice: normalizedOriginal,
    percentOff,
    isOnSale: percentOff > 0
  };
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

function normalizeStorefrontPages(
  storefrontPages: Array<string | null | undefined> | undefined,
  categoryFallback?: string
): StorefrontPage[] {
  const normalized = Array.from(
    new Set(
      (Array.isArray(storefrontPages) ? storefrontPages : [])
        .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
        .filter((value): value is StorefrontPage => isStorefrontPage(value))
    )
  );

  if (normalized.length > 0) {
    return normalized;
  }

  const fallback = storefrontPageFromCategory(categoryFallback || "");
  return fallback ? [fallback] : [STOREFRONT_PAGES[0]];
}

function normalizeCollectionTypes(input: {
  flashSaleEligible?: boolean;
  bestSeller?: boolean;
}): ProductCollection[] {
  const next: ProductCollection[] = [];

  if (input.flashSaleEligible === true) {
    next.push("FLASH_SALE");
  }

  if (input.bestSeller === true) {
    next.push("BEST_SELLERS");
  }

  return next;
}

function normalizeVariants(input: unknown): NormalizedProductVariant[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((entry, index) => {
      const variant = entry as Record<string, unknown>;
      const id = typeof variant.id === "string" ? variant.id.trim() : "";
      const name = typeof variant.name === "string" ? variant.name.trim() : "";
      const price = Number(variant.price);
      const originalPrice = normalizeVariantOriginalPrice(price, variant.originalPrice);
      const stockQty = normalizeVariantStockQty(variant.stockQty);
      const enabled = typeof variant.enabled === "boolean" ? variant.enabled : true;
      const sortOrderRaw = Number(variant.sortOrder);
      const sortOrder = Number.isInteger(sortOrderRaw) && sortOrderRaw >= 0 ? sortOrderRaw : index;

      return {
        id: id || null,
        name,
        price,
        originalPrice,
        stockQty,
        enabled,
        sortOrder
      };
    })
    .filter((variant) => variant.name.length > 0 && Number.isFinite(variant.price) && variant.price >= 0)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((variant, index) => ({ ...variant, sortOrder: index }));
}

function normalizeFallbackPrice(value: number | undefined): number {
  return Number.isFinite(value) && (value as number) >= 0 ? (value as number) : 0;
}

function ensureUsableVariants(
  variants: NormalizedProductVariant[],
  fallbackPrice: number | undefined
): NormalizedProductVariant[] {
  if (variants.length > 0) {
    return variants;
  }

  return [
    {
      name: "Default",
      price: normalizeFallbackPrice(fallbackPrice),
      originalPrice: null,
      stockQty: null,
      enabled: true,
      sortOrder: 0
    }
  ];
}

function deriveDisplayPrice(
  variants: Array<{ price: number; enabled: boolean; sortOrder: number }>,
  fallbackPrice: number | undefined
): number {
  const orderedVariants = [...variants].sort((left, right) => left.sortOrder - right.sortOrder);
  const firstEnabled = orderedVariants.find((variant) => variant.enabled);

  if (firstEnabled) {
    return firstEnabled.price;
  }

  if (orderedVariants[0]) {
    return orderedVariants[0].price;
  }

  return normalizeFallbackPrice(fallbackPrice);
}

function toProductView<
  T extends {
    category: string;
    images: Array<{ url: string; sortOrder: number }>;
    placements: Array<{ storefrontPage: string }>;
    collections?: Array<{ collection: string }>;
    price: number;
    variants?: Array<{
      id: string;
      name: string;
      price: number;
      originalPrice: number | null;
      stockQty: number | null;
      enabled: boolean;
      sortOrder: number;
    }>;
  }
>(product: T) {
  const orderedImages = [...product.images]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image) => image.url);
  const primaryImage = orderedImages[0] ?? FALLBACK_IMAGE;
  const storefrontPages = Array.from(
    new Set(
      (Array.isArray(product.placements) ? product.placements : [])
        .map((placement) => placement.storefrontPage)
        .filter((page): page is StorefrontPage => isStorefrontPage(page))
    )
  );
  const collectionTypes = Array.from(
    new Set(
      (Array.isArray(product.collections) ? product.collections : [])
        .map((entry) => entry.collection)
        .filter((value): value is ProductCollection => isProductCollection(value))
    )
  );

  const variants = (Array.isArray(product.variants) ? product.variants : [])
    .map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      originalPrice: variant.originalPrice,
      stockQty: variant.stockQty,
      enabled: variant.enabled,
      sortOrder: variant.sortOrder,
      sale: buildSaleDisplay(variant.price, variant.originalPrice)
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const displayVariant = variants.find((variant) => variant.enabled) ?? variants[0] ?? null;
  const sale = buildSaleDisplay(product.price, displayVariant?.originalPrice ?? null);

  return {
    ...product,
    image: primaryImage,
    images: orderedImages,
    storefrontPages: storefrontPages.length > 0 ? storefrontPages : normalizeStorefrontPages([], product.category),
    collectionTypes,
    flashSaleEligible: collectionTypes.includes("FLASH_SALE"),
    bestSeller: collectionTypes.includes("BEST_SELLERS"),
    currentPrice: product.price,
    originalPrice: sale.originalPrice,
    percentOff: sale.percentOff,
    isOnSale: sale.isOnSale,
    sale,
    variants
  };
}

export async function listProducts(category?: string, storefrontPage?: string, collection?: ProductCollection) {
  if (category && !isProductCategory(category)) {
    throw new Error("INVALID_PRODUCT_CATEGORY");
  }

  if (storefrontPage && !isStorefrontPage(storefrontPage)) {
    throw new Error("INVALID_STOREFRONT_PAGE");
  }

  if (collection && !isProductCollection(collection)) {
    throw new Error("INVALID_PRODUCT_COLLECTION");
  }

  const where = {
    enabled: true,
    ...(category ? { category } : {}),
    ...(storefrontPage
      ? {
          placements: {
            some: {
              storefrontPage
            }
          }
        }
      : {}),
    ...(collection
      ? {
          collections: {
            some: {
              collection
            }
          }
        }
      : {})
  };

  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      },
      placements: {
        orderBy: { storefrontPage: "asc" }
      },
      collections: {
        orderBy: { collection: "asc" }
      },
      variants: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return products.map(toProductView);
}

export async function getProductById(
  productId: string,
  options?: { includeDisabled?: boolean }
) {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
      ...(options?.includeDisabled ? {} : { enabled: true })
    },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      },
      placements: {
        orderBy: { storefrontPage: "asc" }
      },
      collections: {
        orderBy: { collection: "asc" }
      },
      variants: {
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
      },
      placements: {
        orderBy: { storefrontPage: "asc" }
      },
      collections: {
        orderBy: { collection: "asc" }
      },
      variants: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return products.map(toProductView);
}

export async function createProduct(input: AdminProductInput) {
  const id = randomUUID();
  const images = resolveInputImages(input);
  const storefrontPages = normalizeStorefrontPages(input.storefrontPages, input.category);
  const collectionTypes = normalizeCollectionTypes(input);
  const variants = ensureUsableVariants(normalizeVariants(input.variants), input.price);
  const derivedPrice = deriveDisplayPrice(variants, input.price);

  const product = await prisma.product.create({
    data: {
      id,
      name: input.name,
      price: derivedPrice,
      category: input.category,
      enabled: input.enabled ?? true,
      sku: input.sku ?? null,
      description: input.description ?? null,
      brand: input.brand ?? null,
      stockQty: input.stockQty ?? null,
      placements: {
        createMany: {
          data: storefrontPages.map((storefrontPage) => ({ storefrontPage }))
        }
      },
      collections: {
        createMany: {
          data: collectionTypes.map((collection) => ({ collection }))
        }
      },
      images: {
        create: images.map((url, index) => ({
          url,
          alt: input.name,
          sortOrder: index
        }))
      },
      variants: {
        createMany: {
          data: variants.map((variant) => ({
            id: variant.id && variant.id.trim() ? variant.id : randomUUID(),
            name: variant.name,
            price: variant.price,
            originalPrice: variant.originalPrice,
            stockQty: variant.stockQty,
            enabled: variant.enabled,
            sortOrder: variant.sortOrder
          }))
        }
      }
    },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      },
      placements: {
        orderBy: { storefrontPage: "asc" }
      },
      collections: {
        orderBy: { collection: "asc" }
      },
      variants: {
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
    const nextStorefrontPages =
      "storefrontPages" in input
        ? normalizeStorefrontPages(input.storefrontPages, input.category)
        : null;
    const nextCollectionTypes =
      "flashSaleEligible" in input || "bestSeller" in input
        ? normalizeCollectionTypes({
            flashSaleEligible: input.flashSaleEligible,
            bestSeller: input.bestSeller
          })
        : null;
    const nextVariants =
      "variants" in input
        ? ensureUsableVariants(normalizeVariants(input.variants), input.price)
        : null;

    const product = await tx.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        price: input.price,
        category: input.category,
        enabled: input.enabled,
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

    if (nextStorefrontPages) {
      await tx.productPlacement.deleteMany({ where: { productId } });
      await tx.productPlacement.createMany({
        data: nextStorefrontPages.map((storefrontPage) => ({
          productId,
          storefrontPage
        }))
      });
    }

    if (nextCollectionTypes) {
      await tx.productCollectionMembership.deleteMany({ where: { productId } });
      if (nextCollectionTypes.length > 0) {
        await tx.productCollectionMembership.createMany({
          data: nextCollectionTypes.map((collection) => ({
            productId,
            collection
          }))
        });
      }
    }

    if (nextVariants) {
      const existingVariants = await tx.productVariant.findMany({
        where: { productId },
        select: { id: true }
      });
      const existingVariantIds = new Set(existingVariants.map((variant) => variant.id));
      const variantIdsToKeep = nextVariants
        .map((variant) => variant.id)
        .filter((variantId): variantId is string => Boolean(variantId && existingVariantIds.has(variantId)));

      await tx.productVariant.deleteMany({
        where: {
          productId,
          ...(variantIdsToKeep.length > 0 ? { id: { notIn: variantIdsToKeep } } : {})
        }
      });

      for (const variant of nextVariants) {
        const requestedId = variant.id && variant.id.trim() ? variant.id : null;

        if (requestedId && existingVariantIds.has(requestedId)) {
          await tx.productVariant.update({
            where: { id: requestedId },
            data: {
              name: variant.name,
              price: variant.price,
              originalPrice: variant.originalPrice,
              stockQty: variant.stockQty,
              enabled: variant.enabled,
              sortOrder: variant.sortOrder
            }
          });
          continue;
        }

        await tx.productVariant.create({
          data: {
            id: requestedId ?? randomUUID(),
            productId,
            name: variant.name,
            price: variant.price,
            originalPrice: variant.originalPrice,
            stockQty: variant.stockQty,
            enabled: variant.enabled,
            sortOrder: variant.sortOrder
          }
        });
      }
    }

    let resolvedVariants = await tx.productVariant.findMany({
      where: { productId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    });

    if (resolvedVariants.length === 0) {
      await tx.productVariant.create({
        data: {
          id: randomUUID(),
          productId,
          name: "Default",
          price: normalizeFallbackPrice(input.price ?? product.price),
          originalPrice: null,
          stockQty: null,
          enabled: true,
          sortOrder: 0
        }
      });

      resolvedVariants = await tx.productVariant.findMany({
        where: { productId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      });
    }

    const derivedPrice = deriveDisplayPrice(resolvedVariants, input.price ?? product.price);
    if (product.price !== derivedPrice) {
      await tx.product.update({
        where: { id: productId },
        data: { price: derivedPrice }
      });
    }

    const hydratedProduct = await tx.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        },
        placements: {
          orderBy: { storefrontPage: "asc" }
        },
        collections: {
          orderBy: { collection: "asc" }
        },
        variants: {
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

export async function listRelatedProducts(productId: string, limit = 4) {
  const target = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, category: true, enabled: true }
  });

  if (!target || !target.enabled) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      enabled: true,
      category: target.category,
      id: { not: productId }
    },
    take: Math.max(0, Math.min(12, limit)),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      },
      placements: {
        orderBy: { storefrontPage: "asc" }
      },
      collections: {
        orderBy: { collection: "asc" }
      },
      variants: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  return products.map(toProductView);
}
