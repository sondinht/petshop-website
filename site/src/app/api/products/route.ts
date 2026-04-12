import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/src/server/productRepo";
import { isProductCategory } from "@/src/server/productTypes";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  if (category && !isProductCategory(category)) {
    return NextResponse.json(
      { error: "Invalid category" },
      {
        status: 400
      }
    );
  }

  const products = await listProducts(category ?? undefined);
  return NextResponse.json({ products });
}
