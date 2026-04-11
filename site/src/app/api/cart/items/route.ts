import { NextRequest, NextResponse } from "next/server";
import { addCartItem } from "@/src/server/cartRepo";
import { applySessionCookie, getOrCreateSessionId } from "@/src/server/session";

export async function POST(request: NextRequest) {
  const session = getOrCreateSessionId(request);
  const body = (await request.json().catch(() => null)) as
    | { productId?: string; quantity?: number }
    | null;

  if (!body?.productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const quantity = Number(body.quantity ?? 1);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return NextResponse.json(
      { error: "quantity must be a positive integer" },
      { status: 400 }
    );
  }

  try {
    const cart = await addCartItem(session.id, body.productId, quantity);
    const response = NextResponse.json(cart, { status: 201 });
    return applySessionCookie(response, session);
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to add cart item" }, { status: 500 });
  }
}
