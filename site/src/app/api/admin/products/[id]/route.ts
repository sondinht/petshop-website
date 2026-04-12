import { NextRequest, NextResponse } from "next/server";
import { requireBackofficeUser } from "@/src/server/auth/adminSession";
import {
  deleteProduct,
  getProductById,
  patchProduct,
  type AdminProductPatchInput
} from "@/src/server/productRepo";

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

  const product = await getProductById(context.params.id);

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
