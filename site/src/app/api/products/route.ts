import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/src/server/productRepo";
import { isProductCategory, isProductCollection, isStorefrontPage } from "@/src/server/productTypes";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const storefrontPage = request.nextUrl.searchParams.get("storefrontPage");
  const collection = request.nextUrl.searchParams.get("collection");

  if (category && !isProductCategory(category)) {
    return NextResponse.json(
      { error: "Invalid category" },
      {
        status: 400
      }
    );
  }

  if (storefrontPage && !isStorefrontPage(storefrontPage)) {
    return NextResponse.json(
      { error: "Invalid storefrontPage" },
      {
        status: 400
      }
    );
  }

  if (collection && !isProductCollection(collection)) {
    return NextResponse.json(
      { error: "Invalid collection" },
      {
        status: 400
      }
    );
  }

  const normalizedCollection = collection && isProductCollection(collection) ? collection : undefined;

  const products = await listProducts(
    category ?? undefined,
    storefrontPage ?? undefined,
    normalizedCollection
  );
  return NextResponse.json({ products });
}
