import { NextRequest, NextResponse } from "next/server";
import { patchCartItem, removeCartItem } from "@/src/server/cartRepo";
import { applySessionCookie, getOrCreateSessionId } from "@/src/server/session";

export async function PATCH(
  request: NextRequest,
  context: { params: { productId: string } }
) {
  const session = getOrCreateSessionId(request);
  const cartItemId = Number(context.params.productId);

  if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
    return NextResponse.json({ error: "Invalid cart item id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | { quantity?: number; savedForLater?: boolean }
    | null;

  const hasQuantity = body?.quantity !== undefined;
  const quantity = hasQuantity ? Number(body?.quantity) : undefined;
  const hasSavedForLater = body?.savedForLater !== undefined;
  const savedForLater = body?.savedForLater;

  if (hasQuantity && (!Number.isInteger(quantity) || (quantity as number) < 0)) {
    return NextResponse.json(
      { error: "quantity must be a non-negative integer" },
      { status: 400 }
    );
  }

  if (hasSavedForLater && typeof savedForLater !== "boolean") {
    return NextResponse.json(
      { error: "savedForLater must be a boolean" },
      { status: 400 }
    );
  }

  if (!hasQuantity && !hasSavedForLater) {
    return NextResponse.json(
      { error: "At least one of quantity or savedForLater is required" },
      { status: 400 }
    );
  }

  try {
    const cart = await patchCartItem(session.id, cartItemId, {
      ...(hasQuantity ? { quantity: quantity as number } : {}),
      ...(hasSavedForLater ? { savedForLater: savedForLater as boolean } : {})
    });
    const response = NextResponse.json(cart);
    return applySessionCookie(response, session);
  } catch (error) {
    if (error instanceof Error && error.message === "CART_ITEM_NOT_FOUND") {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "NO_CART_ITEM_PATCH_FIELDS") {
      return NextResponse.json(
        { error: "At least one of quantity or savedForLater is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Unable to patch cart item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { productId: string } }
) {
  const session = getOrCreateSessionId(request);
  const cartItemId = Number(context.params.productId);

  if (!Number.isInteger(cartItemId) || cartItemId <= 0) {
    return NextResponse.json({ error: "Invalid cart item id" }, { status: 400 });
  }

  const cart = await removeCartItem(session.id, cartItemId);
  const response = NextResponse.json(cart, { status: 200 });
  return applySessionCookie(response, session);
}
