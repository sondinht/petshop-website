import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdminUser } from "@/src/server/auth/adminSession";
import {
  createAdminManagedUser,
  USER_ROLES,
  USER_STATUSES,
  getAdminUserSummary,
  listAdminUsers,
  type UserRole,
  type UserStatus
} from "@/src/server/userRepo";

function parseRole(value: string | null): UserRole | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (USER_ROLES.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }

  return undefined;
}

function parseStatus(value: string | null): UserStatus | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (USER_STATUSES.includes(normalized as UserStatus)) {
    return normalized as UserStatus;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  let admin;

  try {
    admin = await requireAdminUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleParam = request.nextUrl.searchParams.get("role");
  const statusParam = request.nextUrl.searchParams.get("status");
  const role = parseRole(roleParam);
  const status = parseStatus(statusParam);

  if (roleParam && !role) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (statusParam && !status) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  if (limitParam && (!Number.isInteger(limit) || (limit as number) <= 0)) {
    return NextResponse.json({ error: "limit must be a positive integer" }, { status: 400 });
  }

  const [users, summary] = await Promise.all([
    listAdminUsers({ role, status, q, limit }),
    getAdminUserSummary()
  ]);

  return NextResponse.json({
    users,
    summary,
    currentUserId: admin.id
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown; role?: unknown; status?: unknown }
    | null;

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = typeof body?.role === "string" ? body.role.trim().toUpperCase() : "";
  const status = typeof body?.status === "string" ? body.status.trim().toUpperCase() : "ENABLED";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (role !== "ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "role must be ADMIN or STAFF" }, { status: 400 });
  }

  if (status !== "ENABLED" && status !== "DISABLED") {
    return NextResponse.json({ error: "status must be ENABLED or DISABLED" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createAdminManagedUser({
      email,
      passwordHash,
      role,
      status
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Unable to create user" }, { status: 500 });
  }
}
