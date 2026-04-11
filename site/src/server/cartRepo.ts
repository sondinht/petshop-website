import { prisma } from "./db/prisma";

export type CartViewItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  image: string;
};

export type CartView = {
  items: CartViewItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
};

const TAX_RATE = 0.08;

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

async function getOrCreateCart(sessionId: string) {
  return prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {},
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });
}

function toCartView(
  items: Array<{ quantity: number; product: { id: string; name: string; price: number; image: string } }>
): CartView {
  const viewItems: CartViewItem[] = items.map((item) => ({
    productId: item.product.id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    lineTotal: toMoney(item.quantity * item.product.price),
    image: item.product.image
  }));

  const subtotal = toMoney(viewItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const tax = toMoney(subtotal * TAX_RATE);
  const total = toMoney(subtotal + tax);
  const itemCount = viewItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: viewItems,
    subtotal,
    tax,
    total,
    itemCount
  };
}

export async function getCartView(sessionId: string): Promise<CartView> {
  const cart = await getOrCreateCart(sessionId);
  return toCartView(cart.items);
}

export async function addCartItem(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<CartView> {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  await prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {}
  });

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartSessionId_productId: {
        cartSessionId: sessionId,
        productId
      }
    }
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartSessionId: sessionId,
        productId,
        quantity
      }
    });
  }

  return getCartView(sessionId);
}

export async function patchCartItem(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<CartView> {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  await prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {}
  });

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartSessionId_productId: {
        cartSessionId: sessionId,
        productId
      }
    }
  });

  if (!existing) {
    throw new Error("CART_ITEM_NOT_FOUND");
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity }
    });
  }

  return getCartView(sessionId);
}

export async function removeCartItem(
  sessionId: string,
  productId: string
): Promise<CartView> {
  await prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {}
  });

  await prisma.cartItem.deleteMany({
    where: {
      cartSessionId: sessionId,
      productId
    }
  });

  return getCartView(sessionId);
}

export async function clearCart(sessionId: string): Promise<void> {
  await prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {}
  });

  await prisma.cartItem.deleteMany({
    where: { cartSessionId: sessionId }
  });
}
