import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/src/server/auth/adminSession";
import { updateAdminOrderStatus, type OrderStatus } from "@/src/server/orderRepo";

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function parseStatus(value: unknown): OrderStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (ORDER_STATUSES.includes(normalized as OrderStatus)) {
    return normalized as OrderStatus;
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(context.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const status = parseStatus(body?.status);

  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  try {
    const order = await updateAdminOrderStatus(id, status);
    return NextResponse.json({ order });
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2025")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}
