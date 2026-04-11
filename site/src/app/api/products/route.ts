import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/src/server/productRepo";
import type { ProductCategory } from "@/src/server/catalog";

const validCategories = new Set<ProductCategory>([
  "dogs",
  "cats",
  "accessories",
  "deals"
]);

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  if (category && !validCategories.has(category as ProductCategory)) {
    return NextResponse.json(
      { error: "Invalid category" },
      {
        status: 400
      }
    );
  }

  const products = await listProducts(category as ProductCategory | undefined);
  return NextResponse.json({ products });
}
