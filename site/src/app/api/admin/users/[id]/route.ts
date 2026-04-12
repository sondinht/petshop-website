import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/src/server/auth/adminSession";
import {
  USER_ROLES,
  USER_STATUSES,
  updateAdminManagedUser,
  type UserRole,
  type UserStatus
} from "@/src/server/userRepo";

function parseOptionalRole(value: unknown): UserRole | null {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (USER_ROLES.includes(normalized as UserRole)) {
    return normalized as UserRole;
  }

  return null;
}

function parseOptionalStatus(value: unknown): UserStatus | null {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (USER_STATUSES.includes(normalized as UserStatus)) {
    return normalized as UserStatus;
  }

  return null;
}

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  let admin;

  try {
    admin = await requireAdminUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetUserId = context.params.id;

  if (!targetUserId || typeof targetUserId !== "string") {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | { role?: unknown; status?: unknown }
    | null;

  const hasRoleField = Boolean(body && Object.prototype.hasOwnProperty.call(body, "role"));
  const hasStatusField = Boolean(body && Object.prototype.hasOwnProperty.call(body, "status"));

  if (!hasRoleField && !hasStatusField) {
    return NextResponse.json(
      { error: "role or status is required" },
      { status: 400 }
    );
  }

  const role = parseOptionalRole(body?.role);
  const status = parseOptionalStatus(body?.status);

  if (hasRoleField && !role) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (hasStatusField && !status) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const user = await updateAdminManagedUser({
      actorUserId: admin.id,
      targetUserId,
      input: {
        role: role ?? undefined,
        status: status ?? undefined
      }
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "USER_NOT_FOUND" || hasPrismaErrorCode(error, "P2025")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (message === "SELF_LOCKOUT_NOT_ALLOWED") {
      return NextResponse.json(
        {
          error: "You cannot disable or demote your own admin account."
        },
        { status: 409 }
      );
    }

    if (message === "LAST_ENABLED_ADMIN") {
      return NextResponse.json(
        {
          error: "Cannot disable or demote the last enabled admin account."
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }
}
