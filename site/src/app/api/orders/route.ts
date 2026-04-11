import { NextRequest, NextResponse } from "next/server";
import { createOrder, listOrders, type CreateOrderInput } from "@/src/server/orderRepo";
import { applySessionCookie, getOrCreateSessionId } from "@/src/server/session";

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCreateOrderPayload(body: unknown): CreateOrderInput {
  const input = body as Record<string, unknown> | null;

  return {
    customerName: normalizeOptionalString(input?.customerName),
    addressLine1: normalizeOptionalString(input?.addressLine1),
    city: normalizeOptionalString(input?.city),
    postalCode: normalizeOptionalString(input?.postalCode),
    deliveryMethod: normalizeOptionalString(input?.deliveryMethod)
  };
}

export async function GET(request: NextRequest) {
  const session = getOrCreateSessionId(request);
  const response = NextResponse.json({ orders: await listOrders(session.id) });
  return applySessionCookie(response, session);
}

export async function POST(request: NextRequest) {
  const session = getOrCreateSessionId(request);
  const body = (await request.json().catch(() => null)) as unknown;
  const payload = parseCreateOrderPayload(body);

  try {
    const order = await createOrder(session.id, payload);
    const response = NextResponse.json(
      { orderNumber: order.orderNumber, order },
      { status: 201 }
    );
    return applySessionCookie(response, session);
  } catch (error) {
    if (error instanceof Error && error.message === "EMPTY_CART") {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to create order" }, { status: 500 });
  }
}
