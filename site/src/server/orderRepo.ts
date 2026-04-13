import { getCartView, type CartViewItem } from "./cartRepo";
import { prisma } from "./db/prisma";
import type { Prisma } from "@prisma/client";

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";

export type OrderItem = {
  productId: string;
  productVariantId: string | null;
  variantName: string | null;
  name: string;
  price: number;
  quantity: number;
};

export type OrderView = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string | null;
  addressLine1: string | null;
  city: string | null;
  postalCode: string | null;
  deliveryMethod: string | null;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
};

export type CreateOrderInput = {
  customerName?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  postalCode?: string | null;
  deliveryMethod?: string | null;
};

export type AdminOrderListInput = {
  status?: OrderStatus;
  q?: string;
  limit?: number;
};

export type AdminOrderListItem = {
  id: number;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  status: OrderStatus;
  createdAt: string;
  amount: number;
};

function mapOrder(order: {
  orderNumber: string;
  createdAt: Date;
  status: OrderStatus;
  customerName: string | null;
  addressLine1: string | null;
  city: string | null;
  postalCode: string | null;
  deliveryMethod: string | null;
  subtotal: number;
  tax: number;
  total: number;
  items: Array<{
    productId: string;
    productVariantId: string | null;
    variantName: string | null;
    name: string;
    price: number;
    quantity: number;
  }>;
}): OrderView {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    customerName: order.customerName,
    addressLine1: order.addressLine1,
    city: order.city,
    postalCode: order.postalCode,
    deliveryMethod: order.deliveryMethod,
    items: order.items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      variantName: item.variantName,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total
  };
}

function createOrderNumber(): string {
  const time = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `PS-${time}-${rand}`;
}

function toOrderItems(items: CartViewItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    productVariantId: item.variantId,
    variantName: item.variantName,
    name: item.name,
    price: item.price,
    quantity: item.quantity
  }));
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function createOrder(
  sessionId: string,
  input?: CreateOrderInput
): Promise<OrderView> {
  const cart = await getCartView(sessionId);

  if (cart.items.length === 0) {
    throw new Error("EMPTY_CART");
  }

  const orderItems = toOrderItems(cart.items);

  for (let attempts = 0; attempts < 5; attempts += 1) {
    const orderNumber = createOrderNumber();

    try {
      const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            sessionId,
            customerName: normalizeOptionalString(input?.customerName),
            addressLine1: normalizeOptionalString(input?.addressLine1),
            city: normalizeOptionalString(input?.city),
            postalCode: normalizeOptionalString(input?.postalCode),
            deliveryMethod: normalizeOptionalString(input?.deliveryMethod),
            subtotal: cart.subtotal,
            tax: cart.tax,
            total: cart.total,
            items: {
              create: orderItems
            }
          },
          include: {
            items: true
          }
        });

        await tx.cart.upsert({
          where: { sessionId },
          create: { sessionId },
          update: {}
        });

        await tx.cartItem.deleteMany({
          where: {
            cartSessionId: sessionId,
            savedForLater: false
          }
        });

        return createdOrder;
      });
      return mapOrder(order);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("ORDER_NUMBER_COLLISION");
}

export async function listOrders(sessionId: string): Promise<OrderView[]> {
  const orders = await prisma.order.findMany({
    where: { sessionId },
    include: {
      items: true
    },
    orderBy: { createdAt: "desc" }
  });

  return orders.map(mapOrder);
}

function mapAdminOrder(order: {
  id: number;
  orderNumber: string;
  customerName: string | null;
  status: OrderStatus;
  createdAt: Date;
  total: number;
}): AdminOrderListItem {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: null,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    amount: order.total
  };
}

export async function listAdminOrders(input: AdminOrderListInput): Promise<AdminOrderListItem[]> {
  const where: {
    status?: OrderStatus;
    orderNumber?: { contains: string };
  } = {};

  if (input.status) {
    where.status = input.status;
  }

  const search = normalizeOptionalString(input.q);
  if (search) {
    where.orderNumber = { contains: search };
  }

  const requestedLimit = Number.isInteger(input.limit) ? (input.limit as number) : 50;
  const take = Math.min(Math.max(requestedLimit, 1), 100);

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      status: true,
      createdAt: true,
      total: true
    }
  });

  return orders.map(mapAdminOrder);
}

export async function updateAdminOrderStatus(
  id: number,
  status: OrderStatus
): Promise<AdminOrderListItem> {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      status: true,
      createdAt: true,
      total: true
    }
  });

  return mapAdminOrder(order);
}
