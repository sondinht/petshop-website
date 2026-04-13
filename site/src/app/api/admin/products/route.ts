import { NextRequest, NextResponse } from "next/server";
import { requireBackofficeUser } from "@/src/server/auth/adminSession";
import { createProduct, listAdminProducts } from "@/src/server/productRepo";
import { isStorefrontPage, storefrontPageFromCategory } from "@/src/server/productTypes";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80";

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseImageList(input: Record<string, unknown> | null): string[] {
  const fromArray = Array.isArray(input?.images)
    ? input.images
        .map((value) => normalizeOptionalString(value))
        .filter((value): value is string => Boolean(value))
    : [];
  const legacy = normalizeOptionalString(input?.image);
  const ordered = fromArray.length > 0 ? fromArray : legacy ? [legacy] : [];
  return Array.from(new Set(ordered));
}

function parseStorefrontPages(input: Record<string, unknown> | null): string[] | null {
  if (!Array.isArray(input?.storefrontPages)) {
    return null;
  }

  const normalized = Array.from(
    new Set(
      input.storefrontPages
        .map((value) => normalizeOptionalString(value))
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase())
        .filter((value) => isStorefrontPage(value))
    )
  );

  return normalized;
}

function parseVariants(input: Record<string, unknown> | null):
  | {
      variants: Array<{
        id?: string | null;
        name: string;
        price: number;
        originalPrice: number | null;
        stockQty: number | null;
        enabled: boolean;
        sortOrder: number;
      }>;
    }
  | { error: string } {
  if (!Array.isArray(input?.variants)) {
    return { variants: [] };
  }

  const variants = input.variants
    .map((entry, index) => {
      const row = entry as Record<string, unknown>;
      const id = normalizeOptionalString(row?.id);
      const name = normalizeOptionalString(row?.name);
      const price = Number(row?.price);
      const rawOriginalPrice = row?.originalPrice;
      const originalPrice =
        rawOriginalPrice === undefined || rawOriginalPrice === null || rawOriginalPrice === ""
          ? null
          : Number(rawOriginalPrice);
      const rawStockQty = row?.stockQty;
      const stockQty =
        rawStockQty === undefined || rawStockQty === null || rawStockQty === ""
          ? null
          : Number(rawStockQty);
      const enabled = row?.enabled === undefined ? true : row?.enabled;
      const sortOrder = row?.sortOrder === undefined ? index : Number(row?.sortOrder);

      return {
        id,
        name,
        price,
        originalPrice,
        stockQty,
        enabled,
        sortOrder
      };
    })
    .filter((variant) => Boolean(variant.name));

  for (const variant of variants) {
    if (!variant.name) {
      return { error: "variant name is required" };
    }

    if (!Number.isFinite(variant.price) || variant.price < 0) {
      return { error: "variant price must be a non-negative number" };
    }

    if (typeof variant.enabled !== "boolean") {
      return { error: "variant enabled must be a boolean" };
    }

    if (
      variant.originalPrice !== null &&
      (!Number.isFinite(variant.originalPrice) || variant.originalPrice < variant.price)
    ) {
      return { error: "variant originalPrice must be null or greater than or equal to price" };
    }

    if (variant.stockQty !== null && (!Number.isInteger(variant.stockQty) || variant.stockQty < 0)) {
      return { error: "variant stockQty must be a non-negative integer or null" };
    }

    if (!Number.isInteger(variant.sortOrder) || variant.sortOrder < 0) {
      return { error: "variant sortOrder must be a non-negative integer" };
    }
  }

  return {
    variants: variants.map((variant) => ({
      id: variant.id,
      name: variant.name as string,
      price: variant.price,
      originalPrice: variant.originalPrice,
      stockQty: variant.stockQty,
      enabled: variant.enabled as boolean,
      sortOrder: variant.sortOrder
    }))
  };
}

function parseCreatePayload(body: unknown) {
  const input = body as Record<string, unknown> | null;
  const name = normalizeOptionalString(input?.name);
  const category = normalizeOptionalString(input?.category);
  const images = parseImageList(input);
  const variants = parseVariants(input);
  const storefrontPagesInput = parseStorefrontPages(input);
  const rawPrice = input?.price;
  const hasPrice = !(rawPrice === undefined || rawPrice === null || rawPrice === "");
  const price = hasPrice ? Number(rawPrice) : null;
  const stockQtyRaw = input?.stockQty;
  const stockQty =
    stockQtyRaw === undefined || stockQtyRaw === null || stockQtyRaw === ""
      ? null
      : Number(stockQtyRaw);
  const enabled =
    input?.enabled === undefined
      ? true
      : typeof input.enabled === "boolean"
        ? input.enabled
        : null;
  const flashSaleEligible =
    input?.flashSaleEligible === undefined
      ? false
      : typeof input.flashSaleEligible === "boolean"
        ? input.flashSaleEligible
        : null;
  const bestSeller =
    input?.bestSeller === undefined
      ? false
      : typeof input.bestSeller === "boolean"
        ? input.bestSeller
        : null;

  if ("error" in variants) {
    return { error: variants.error };
  }

  if (!name || !category) {
    return { error: "name and category are required" };
  }

  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    return { error: "price must be a non-negative number" };
  }

  if (price === null && variants.variants.length === 0) {
    return { error: "price is required when no variants are provided" };
  }

  if (enabled === null) {
    return { error: "enabled must be a boolean" };
  }

  if (flashSaleEligible === null) {
    return { error: "flashSaleEligible must be a boolean" };
  }

  if (bestSeller === null) {
    return { error: "bestSeller must be a boolean" };
  }

  if (Array.isArray(input?.storefrontPages) && storefrontPagesInput && storefrontPagesInput.length === 0) {
    return { error: "storefrontPages must include at least one valid page" };
  }

  const fallbackPage = storefrontPageFromCategory(category);
  const storefrontPages =
    storefrontPagesInput && storefrontPagesInput.length > 0
      ? storefrontPagesInput
      : fallbackPage
        ? [fallbackPage]
        : ["dogs"];

  if (stockQty !== null && (!Number.isInteger(stockQty) || stockQty < 0)) {
    return { error: "stockQty must be a non-negative integer" };
  }

  return {
    data: {
      name,
      category,
      storefrontPages,
      enabled,
      ...(price !== null ? { price } : {}),
      images: images.length > 0 ? images : [FALLBACK_IMAGE],
      sku: normalizeOptionalString(input?.sku),
      description: normalizeOptionalString(input?.description),
      brand: normalizeOptionalString(input?.brand),
      stockQty,
      flashSaleEligible,
      bestSeller,
      variants: variants.variants
    }
  };
}

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

export async function GET(request: NextRequest) {
  try {
    await requireBackofficeUser(request);
    const products = await listAdminProducts();
    return NextResponse.json({ products });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("admin_products_list_failed", {
      message: error instanceof Error ? error.message : "unknown error"
    });

    return NextResponse.json({ error: "Unable to load products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireBackofficeUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = parseCreatePayload(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const product = await createProduct(parsed.data);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2002")) {
      return NextResponse.json(
        { error: "Product SKU already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Unable to create product" }, { status: 500 });
  }
}
