import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/server/db/prisma";

export const runtime = "nodejs";

type StubChargeBody = {
  orderNumber?: unknown;
};

function parseOrderNumber(body: StubChargeBody | null): string | null {
  if (!body || typeof body.orderNumber !== "string") {
    return null;
  }

  const value = body.orderNumber.trim();
  return value.length > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as StubChargeBody | null;
  const orderNumber = parseOrderNumber(body);

  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber is required" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      total: true
    }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "STUB",
      status: "SUCCEEDED",
      amount: order.total
    },
    select: {
      id: true,
      orderId: true,
      provider: true,
      status: true,
      amount: true,
      createdAt: true
    }
  });

  return NextResponse.json(
    {
      payment,
      orderNumber: order.orderNumber
    },
    { status: 201 }
  );
}
