import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/src/server/auth/adminSession";
import {
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
