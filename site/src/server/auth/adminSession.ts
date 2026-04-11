import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db/prisma";

export const ADMIN_COOKIE_NAME = "petshop_admin";

type AdminTokenClaims = {
  role: "ADMIN";
};

export type AdminSessionUser = {
  id: string;
  email: string;
  role: "ADMIN";
  status: "ENABLED" | "DISABLED";
};

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }

  return secret;
}

export function signAdminSessionToken(userId: string): string {
  return jwt.sign({ role: "ADMIN" } satisfies AdminTokenClaims, getAuthSecret(), {
    algorithm: "HS256",
    subject: userId,
    expiresIn: "12h"
  });
}

export function setAdminSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}

export function clearAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0
  });

  return response;
}

function readAdminUserIdFromCookie(request: NextRequest): string | null {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getAuthSecret(), {
      algorithms: ["HS256"]
    }) as jwt.JwtPayload & AdminTokenClaims;

    if (payload.role !== "ADMIN" || typeof payload.sub !== "string" || !payload.sub) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(request: NextRequest): Promise<AdminSessionUser | null> {
  const userId = readAdminUserIdFromCookie(request);

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true
    }
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

export async function requireAdmin(request: NextRequest): Promise<AdminSessionUser> {
  const admin = await getCurrentAdmin(request);

  if (!admin || admin.status !== "ENABLED") {
    throw new Error("UNAUTHORIZED");
  }

  return admin;
}
