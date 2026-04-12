import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db/prisma";
import {
  requireBackofficeUser,
  setAdminSessionCookie,
  signAdminSessionToken
} from "@/src/server/auth/adminSession";

export const runtime = "nodejs";

function normalizePassword(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: NextRequest) {
  let user;

  try {
    user = await requireBackofficeUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { currentPassword?: unknown; newPassword?: unknown }
    | null;

  const currentPassword = normalizePassword(body?.currentPassword);
  const newPassword = normalizePassword(body?.newPassword);

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "currentPassword and newPassword are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "newPassword must be at least 8 characters" },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      status: true,
      passwordHash: true,
      tokenVersion: true
    }
  });

  if (!dbUser || dbUser.status !== "ENABLED" || (dbUser.role !== "ADMIN" && dbUser.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const validCurrentPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash);

  if (!validCurrentPassword) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const samePassword = await bcrypt.compare(newPassword, dbUser.passwordHash);

  if (samePassword) {
    return NextResponse.json(
      { error: "New password must be different from current password" },
      { status: 400 }
    );
  }

  const nextPasswordHash = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      passwordHash: nextPasswordHash,
      tokenVersion: { increment: 1 }
    },
    select: {
      id: true,
      tokenVersion: true
    }
  });

  const token = signAdminSessionToken({
    id: updatedUser.id,
    role: user.role,
    tokenVersion: updatedUser.tokenVersion
  });

  const response = NextResponse.json({ ok: true });
  return setAdminSessionCookie(response, token);
}
