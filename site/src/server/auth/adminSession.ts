import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db/prisma";

export const ADMIN_COOKIE_NAME = "petshop_admin";

const BACKOFFICE_ROLES = ["ADMIN", "STAFF"] as const;
type BackofficeRole = (typeof BACKOFFICE_ROLES)[number];

function isBackofficeRole(role: string): role is BackofficeRole {
  return role === "ADMIN" || role === "STAFF";
}

type AdminTokenClaims = {
  role: BackofficeRole;
  tokenVersion: number;
};

export type BackofficeSessionUser = {
  id: string;
  email: string;
  role: BackofficeRole;
  tokenVersion: number;
  status: "ENABLED" | "DISABLED";
};

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }

  return secret;
}

export function signAdminSessionToken(user: {
  id: string;
  role: BackofficeRole;
  tokenVersion: number;
}): string {
  return jwt.sign(
    {
      role: user.role,
      tokenVersion: user.tokenVersion
    } satisfies AdminTokenClaims,
    getAuthSecret(),
    {
    algorithm: "HS256",
    subject: user.id,
    expiresIn: "12h"
    }
  );
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

function parseBackofficeTokenClaims(request: NextRequest): {
  userId: string;
  role: BackofficeRole;
  tokenVersion: number;
} | null {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, getAuthSecret(), {
      algorithms: ["HS256"]
    }) as jwt.JwtPayload & AdminTokenClaims;

    if (typeof payload.sub !== "string" || !payload.sub) {
      return null;
    }

    if (!isBackofficeRole(payload.role)) {
      return null;
    }

    if (!Number.isInteger(payload.tokenVersion) || payload.tokenVersion < 0) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
      tokenVersion: payload.tokenVersion
    };
  } catch {
    return null;
  }
}

export async function getCurrentBackofficeUser(
  request: NextRequest
): Promise<BackofficeSessionUser | null> {
  const claims = parseBackofficeTokenClaims(request);

  if (!claims) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: {
      id: true,
      email: true,
      role: true,
      tokenVersion: true,
      status: true
    }
  });

  if (!user || !isBackofficeRole(user.role)) {
    return null;
  }

  if (user.role !== claims.role || user.tokenVersion !== claims.tokenVersion) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
    status: user.status
  };
}

export async function getCurrentAdmin(request: NextRequest): Promise<BackofficeSessionUser | null> {
  const user = await getCurrentBackofficeUser(request);

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function requireBackofficeUser(
  request: NextRequest
): Promise<BackofficeSessionUser> {
  const user = await getCurrentBackofficeUser(request);

  if (!user || user.status !== "ENABLED") {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireAdminUser(request: NextRequest): Promise<BackofficeSessionUser> {
  const admin = await getCurrentAdmin(request);

  if (!admin || admin.status !== "ENABLED") {
    throw new Error("UNAUTHORIZED");
  }

  return admin;
}
