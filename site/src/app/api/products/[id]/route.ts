import { NextResponse } from "next/server";
import { getProductById } from "@/src/server/productRepo";

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const product = await getProductById(context.params.id);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}
