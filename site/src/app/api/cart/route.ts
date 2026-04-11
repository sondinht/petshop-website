import { NextRequest, NextResponse } from "next/server";
import { getCartView } from "@/src/server/cartRepo";
import { applySessionCookie, getOrCreateSessionId } from "@/src/server/session";

export async function GET(request: NextRequest) {
  const session = getOrCreateSessionId(request);
  const cart = await getCartView(session.id);
  const response = NextResponse.json(cart);
  return applySessionCookie(response, session);
}
