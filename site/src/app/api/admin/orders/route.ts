import { NextRequest, NextResponse } from "next/server";
import { requireBackofficeUser } from "@/src/server/auth/adminSession";
import { listAdminOrders, type OrderStatus } from "@/src/server/orderRepo";

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];

function parseStatus(value: string | null): OrderStatus | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (ORDER_STATUSES.includes(normalized as OrderStatus)) {
    return normalized as OrderStatus;
  }

  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    await requireBackofficeUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const status = parseStatus(statusParam);

  if (statusParam && !status) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  if (limitParam && (!Number.isInteger(limit) || (limit as number) <= 0)) {
    return NextResponse.json({ error: "limit must be a positive integer" }, { status: 400 });
  }

  const orders = await listAdminOrders({
    status,
    q,
    limit
  });

  return NextResponse.json({ orders });
}
