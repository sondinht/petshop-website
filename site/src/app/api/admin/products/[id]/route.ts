import { NextRequest, NextResponse } from "next/server";
import { requireBackofficeUser } from "@/src/server/auth/adminSession";
import {
  deleteProduct,
  getProductById,
  patchProduct,
  type AdminProductPatchInput
} from "@/src/server/productRepo";
import { isStorefrontPage } from "@/src/server/productTypes";

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeImageArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map((entry) => normalizeOptionalString(entry))
    .filter((entry): entry is string => Boolean(entry));

  return Array.from(new Set(normalized));
}

function normalizeStorefrontPages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .map((entry) => normalizeOptionalString(entry))
    .filter((entry): entry is string => Boolean(entry))
    .map((entry) => entry.toLowerCase())
    .filter((entry) => isStorefrontPage(entry));

  return Array.from(new Set(normalized));
}

function normalizeVariants(value: unknown):
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
  if (!Array.isArray(value)) {
    return { variants: [] };
  }

  const normalized = value
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

  for (const variant of normalized) {
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
    variants: normalized.map((variant) => ({
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

function parsePatchPayload(body: unknown):
  | { data: AdminProductPatchInput }
  | { error: string } {
  const input = body as Record<string, unknown> | null;

  if (!input || typeof input !== "object") {
    return { error: "Invalid payload" };
  }

  const data: AdminProductPatchInput = {};

  if ("name" in input) {
    const name = normalizeOptionalString(input.name);
    if (!name) {
      return { error: "name cannot be empty" };
    }
    data.name = name;
  }

  if ("category" in input) {
    const category = normalizeOptionalString(input.category);
    if (!category) {
      return { error: "category cannot be empty" };
    }
    data.category = category;
  }

  if ("storefrontPages" in input) {
    const storefrontPages = normalizeStorefrontPages(input.storefrontPages);
    if (storefrontPages.length === 0) {
      return { error: "storefrontPages must include at least one valid page" };
    }
    data.storefrontPages = storefrontPages;
  }

  if ("images" in input || "image" in input) {
    const parsedImages = normalizeImageArray(input.images);
    const legacyImage = normalizeOptionalString(input.image);

    if (parsedImages.length > 0) {
      data.images = parsedImages;
    } else if (legacyImage) {
      data.images = [legacyImage];
    } else {
      data.images = [];
    }
  }

  if ("price" in input) {
    const price = Number(input.price);
    if (!Number.isFinite(price) || price < 0) {
      return { error: "price must be a non-negative number" };
    }
    data.price = price;
  }

  if ("stockQty" in input) {
    const raw = input.stockQty;
    if (raw === null || raw === "") {
      data.stockQty = null;
    } else {
      const stockQty = Number(raw);
      if (!Number.isInteger(stockQty) || stockQty < 0) {
        return { error: "stockQty must be a non-negative integer" };
      }
      data.stockQty = stockQty;
    }
  }

  if ("sku" in input) {
    const sku = normalizeOptionalString(input.sku);
    data.sku = sku ?? null;
  }

  if ("brand" in input) {
    const brand = normalizeOptionalString(input.brand);
    data.brand = brand ?? null;
  }

  if ("description" in input) {
    const description = normalizeOptionalString(input.description);
    data.description = description ?? null;
  }

  if ("enabled" in input) {
    if (typeof input.enabled !== "boolean") {
      return { error: "enabled must be a boolean" };
    }

    data.enabled = input.enabled;
  }

  if ("flashSaleEligible" in input) {
    if (typeof input.flashSaleEligible !== "boolean") {
      return { error: "flashSaleEligible must be a boolean" };
    }

    data.flashSaleEligible = input.flashSaleEligible;
  }

  if ("bestSeller" in input) {
    if (typeof input.bestSeller !== "boolean") {
      return { error: "bestSeller must be a boolean" };
    }

    data.bestSeller = input.bestSeller;
  }

  if ("variants" in input) {
    const parsedVariants = normalizeVariants(input.variants);

    if ("error" in parsedVariants) {
      return { error: parsedVariants.error };
    }

    data.variants = parsedVariants.variants;
  }

  if (Object.keys(data).length === 0) {
    return { error: "No fields to update" };
  }

  return { data };
}

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

async function ensureAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    await requireBackofficeUser(request);
    return null;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const unauthorized = await ensureAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  const product = await getProductById(context.params.id, { includeDisabled: true });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const unauthorized = await ensureAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = parsePatchPayload(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const product = await patchProduct(context.params.id, parsed.data);
    return NextResponse.json({ product });
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2025")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const unauthorized = await ensureAdmin(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    await deleteProduct(context.params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2025")) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (hasPrismaErrorCode(error, "P2003")) {
      return NextResponse.json(
        { error: "Product is referenced by existing cart/order records" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Unable to delete product" }, { status: 500 });
  }
}
