import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/server/auth/adminSession";
import { createProduct, listAdminProducts } from "@/src/server/productRepo";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80";

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCreatePayload(body: unknown) {
  const input = body as Record<string, unknown> | null;
  const name = normalizeOptionalString(input?.name);
  const category = normalizeOptionalString(input?.category);
  const image = normalizeOptionalString(input?.image) ?? FALLBACK_IMAGE;
  const price = Number(input?.price);
  const stockQtyRaw = input?.stockQty;
  const stockQty =
    stockQtyRaw === undefined || stockQtyRaw === null || stockQtyRaw === ""
      ? null
      : Number(stockQtyRaw);

  if (!name || !category || !Number.isFinite(price) || price < 0) {
    return { error: "name, category, and non-negative price are required" };
  }

  if (stockQty !== null && (!Number.isInteger(stockQty) || stockQty < 0)) {
    return { error: "stockQty must be a non-negative integer" };
  }

  return {
    data: {
      name,
      category,
      price,
      image,
      sku: normalizeOptionalString(input?.sku),
      description: normalizeOptionalString(input?.description),
      brand: normalizeOptionalString(input?.brand),
      stockQty
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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const products = await listAdminProducts();
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
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
