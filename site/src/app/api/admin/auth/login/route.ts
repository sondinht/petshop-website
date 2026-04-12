import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db/prisma";
import {
  setAdminSessionCookie,
  signAdminSessionToken
} from "@/src/server/auth/adminSession";

export const runtime = "nodejs";

function isMissingAuthSecretError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return message.includes("AUTH_SECRET is required");
}

function isLikelyPrismaSetupError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string; name?: string };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  const name = typeof candidate.name === "string" ? candidate.name : "";

  if (["P2021", "P2022", "P1003", "P1008"].includes(code)) {
    return true;
  }

  if (name === "PrismaClientInitializationError") {
    return true;
  }

  return (
    message.includes("no such table") ||
    message.includes("table") && message.includes("does not exist") ||
    message.includes("column") && message.includes("does not exist") ||
    message.includes("the table") && message.includes("does not exist")
  );
}

function setupErrorResponse(error: string, code: string, hint: string) {
  return NextResponse.json({ error, code, hint }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { email?: string; password?: string }
      | null;

    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        tokenVersion: true,
        status: true
      }
    });

    if (
      !user ||
      (user.role !== "ADMIN" && user.role !== "STAFF") ||
      user.status !== "ENABLED"
    ) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signAdminSessionToken({
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion
    });
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role }
    });

    return setAdminSessionCookie(response, token);
  } catch (error) {
    if (isMissingAuthSecretError(error)) {
      return setupErrorResponse(
        "Admin authentication is not configured.",
        "AUTH_SECRET_MISSING",
        "Set AUTH_SECRET in site/.env and restart the server."
      );
    }

    if (isLikelyPrismaSetupError(error)) {
      return setupErrorResponse(
        "Database is not ready for admin login.",
        "DB_NOT_READY",
        "Run prisma migrate and seed (npm run prisma:migrate -- --name init, npm run prisma:seed)."
      );
    }

    console.error("admin_login_failed", {
      message: error instanceof Error ? error.message : "unknown error"
    });

    return setupErrorResponse(
      "Unable to complete admin login.",
      "ADMIN_LOGIN_FAILED",
      "Check server logs and environment setup."
    );
  }
}
