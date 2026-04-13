import { NextResponse } from "next/server";
import { getProductById, listRelatedProducts } from "@/src/server/productRepo";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const product = await getProductById(context.params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const relatedLimitRaw = url.searchParams.get("relatedLimit");
  const relatedLimit = relatedLimitRaw ? Number(relatedLimitRaw) : 4;
  const relatedProducts = await listRelatedProducts(
    context.params.id,
    Number.isInteger(relatedLimit) && relatedLimit > 0 ? relatedLimit : 4
  );

  return NextResponse.json({ product, relatedProducts });
}
