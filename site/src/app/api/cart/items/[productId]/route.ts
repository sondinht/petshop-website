import { NextRequest, NextResponse } from "next/server";
import { patchCartItem, removeCartItem } from "@/src/server/cartRepo";
import { applySessionCookie, getOrCreateSessionId } from "@/src/server/session";

export async function PATCH(
  request: NextRequest,
  context: { params: { productId: string } }
) {
  const session = getOrCreateSessionId(request);
  const body = (await request.json().catch(() => null)) as
    | { quantity?: number }
    | null;
  const quantity = Number(body?.quantity);

  if (!Number.isInteger(quantity) || quantity < 0) {
    return NextResponse.json(
      { error: "quantity must be a non-negative integer" },
      { status: 400 }
    );
  }

  try {
    const cart = await patchCartItem(session.id, context.params.productId, quantity);
    const response = NextResponse.json(cart);
    return applySessionCookie(response, session);
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "CART_ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to patch cart item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { productId: string } }
) {
  const session = getOrCreateSessionId(request);
  const cart = await removeCartItem(session.id, context.params.productId);
  const response = NextResponse.json(cart, { status: 200 });
  return applySessionCookie(response, session);
}
