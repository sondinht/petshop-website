import { prisma } from "@/src/server/db/prisma";

export const USER_ROLES = ["ADMIN", "STAFF", "CUSTOMER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export async function createAdminManagedUser(input: {
  email: string;
  passwordHash: string;
  role: Extract<UserRole, "ADMIN" | "STAFF">;
  status?: UserStatus;
}): Promise<AdminManagedUser> {
  const created = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      status: input.status ?? "ENABLED"
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return mapAdminManagedUser(created);
}
export const USER_STATUSES = ["ENABLED", "DISABLED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export type AdminUserListInput = {
  q?: string;
  role?: UserRole;
  status?: UserStatus;
  limit?: number;
};

export type AdminManagedUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserSummary = {
  total: number;
  enabled: number;
  disabled: number;
  admins: number;
  staff: number;
  customers: number;
};

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function mapAdminManagedUser(user: {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}): AdminManagedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    tokenVersion: user.tokenVersion,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export async function listAdminUsers(input: AdminUserListInput): Promise<AdminManagedUser[]> {
  const where: {
    role?: UserRole;
    roleIn?: { in: UserRole[] };
    status?: UserStatus;
    email?: { contains: string };
  } = {};

  if (input.role) {
    where.role = input.role;
  } else {
    where.roleIn = { in: ["ADMIN", "STAFF"] };
  }

  if (input.status) {
    where.status = input.status;
  }

  const q = normalizeOptionalString(input.q);
  if (q) {
    where.email = { contains: q };
  }

  const requestedLimit = Number.isInteger(input.limit) ? (input.limit as number) : 100;
  const take = Math.min(Math.max(requestedLimit, 1), 200);

  const users = await prisma.user.findMany({
    where: {
      ...(where.role ? { role: where.role } : {}),
      ...(where.roleIn ? { role: where.roleIn } : {}),
      ...(where.status ? { status: where.status } : {}),
      ...(where.email ? { email: where.email } : {})
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return users.map((user) => mapAdminManagedUser(user));
}

export async function getAdminUserSummary(): Promise<AdminUserSummary> {
  const [total, enabled, disabled, admins, staff, customers] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["ADMIN", "STAFF"] } } }),
    prisma.user.count({ where: { status: "ENABLED", role: { in: ["ADMIN", "STAFF"] } } }),
    prisma.user.count({ where: { status: "DISABLED", role: { in: ["ADMIN", "STAFF"] } } }),
    prisma.user.count({ where: { role: "ADMIN", status: "ENABLED" } }),
    prisma.user.count({ where: { role: "STAFF", status: "ENABLED" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } })
  ]);

  return {
    total,
    enabled,
    disabled,
    admins,
    staff,
    customers
  };
}

export type UpdateAdminUserInput = {
  role?: UserRole;
  status?: UserStatus;
};

export async function updateAdminManagedUser(params: {
  actorUserId: string;
  targetUserId: string;
  input: UpdateAdminUserInput;
}): Promise<AdminManagedUser> {
  const { actorUserId, targetUserId, input } = params;

  return prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!target) {
      throw new Error("USER_NOT_FOUND");
    }

    const nextRole = input.role ?? target.role;
    const nextStatus = input.status ?? target.status;

    const roleChanged = nextRole !== target.role;
    const statusChanged = nextStatus !== target.status;

    if (!roleChanged && !statusChanged) {
      return mapAdminManagedUser(target);
    }

    const disablesAccess = nextRole !== "ADMIN" || nextStatus !== "ENABLED";

    if (actorUserId === targetUserId && disablesAccess) {
      throw new Error("SELF_LOCKOUT_NOT_ALLOWED");
    }

    const wasEnabledAdmin = target.role === "ADMIN" && target.status === "ENABLED";

    if (wasEnabledAdmin && disablesAccess) {
      const otherEnabledAdmins = await tx.user.count({
        where: {
          id: { not: target.id },
          role: "ADMIN",
          status: "ENABLED"
        }
      });

      if (otherEnabledAdmins < 1) {
        throw new Error("LAST_ENABLED_ADMIN");
      }
    }

    const updated = await tx.user.update({
      where: { id: target.id },
      data: {
        role: nextRole,
        status: nextStatus,
        tokenVersion: { increment: 1 }
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return mapAdminManagedUser(updated);
  });
}
