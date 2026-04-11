import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "petshop_sid";

export type SessionState = {
  id: string;
  isNew: boolean;
};

export function getOrCreateSessionId(request: NextRequest): SessionState {
  const existing = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (existing) {
    return { id: existing, isNew: false };
  }

  return { id: randomUUID(), isNew: true };
}

export function applySessionCookie(
  response: NextResponse,
  session: SessionState
): NextResponse {
  if (!session.isNew) {
    return response;
  }

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: session.id,
    path: "/",
    httpOnly: true,
    sameSite: "lax"
  });

  return response;
}
