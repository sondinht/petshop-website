import { NextRequest, NextResponse } from "next/server";
import { listReviewsForProductOrFallback, listStoreReviews } from "@/src/server/reviewRepo";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;

  if (limitRaw && (!Number.isInteger(limit) || (limit as number) <= 0)) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  if (productId && productId.trim().length > 0) {
    const result = await listReviewsForProductOrFallback(productId.trim(), limit);
    return NextResponse.json(result);
  }

  const result = await listStoreReviews(limit);
  return NextResponse.json(result);
}
