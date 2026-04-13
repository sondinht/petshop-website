import { prisma } from "./db/prisma";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80";

export type CartViewItem = {
  id: number;
  productId: string;
  variantId: string | null;
  variantName: string | null;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  image: string;
  savedForLater: boolean;
};

export type CartView = {
  items: CartViewItem[];
  savedItems: CartViewItem[];
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
          product: {
            include: {
              images: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
              }
            }
          },
          productVariant: true
        }
      }
    }
  });
}

function toCartView(
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    savedForLater: boolean;
    variantName: string | null;
    productVariantId: string | null;
    productVariant: { name: string } | null;
    product: {
      id: string;
      name: string;
      images: Array<{ url: string }>;
    };
  }>
): CartView {
  const viewItems: CartViewItem[] = items.map((item) => ({
    id: item.id,
    productId: item.product.id,
    variantId: item.productVariantId,
    variantName: item.variantName ?? item.productVariant?.name ?? null,
    name: item.product.name,
    price: item.unitPrice,
    quantity: item.quantity,
    lineTotal: toMoney(item.quantity * item.unitPrice),
    image: item.product.images[0]?.url ?? FALLBACK_IMAGE,
    savedForLater: item.savedForLater
  }));

  const itemsForCheckout = viewItems.filter((item) => !item.savedForLater);
  const savedItems = viewItems.filter((item) => item.savedForLater);
  const subtotal = toMoney(itemsForCheckout.reduce((sum, item) => sum + item.lineTotal, 0));
  const tax = toMoney(subtotal * TAX_RATE);
  const total = toMoney(subtotal + tax);
  const itemCount = itemsForCheckout.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: itemsForCheckout,
    savedItems,
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

async function resolveVariantSelection(productId: string, variantId?: string | null) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        where: { enabled: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const selectedVariant =
    typeof variantId === "string" && variantId.trim()
      ? product.variants.find((variant) => variant.id === variantId.trim()) || null
      : product.variants[0] || null;

  if (variantId && !selectedVariant) {
    throw new Error("VARIANT_NOT_FOUND");
  }

  return {
    product,
    selectedVariant
  };
}

export async function addCartItem(
  sessionId: string,
  productId: string,
  quantity: number,
  variantId?: string | null
): Promise<CartView> {
  const { product, selectedVariant } = await resolveVariantSelection(productId, variantId);

  await prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {}
  });

  const existing = await prisma.cartItem.findFirst({
    where: {
      cartSessionId: sessionId,
      productId,
      productVariantId: selectedVariant?.id ?? null
    }
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + quantity,
        unitPrice: selectedVariant?.price ?? product.price,
        variantName: selectedVariant?.name ?? null,
        savedForLater: false
      }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartSessionId: sessionId,
        productId,
        productVariantId: selectedVariant?.id ?? null,
        variantName: selectedVariant?.name ?? null,
        unitPrice: selectedVariant?.price ?? product.price,
        quantity,
        savedForLater: false
      }
    });
  }

  return getCartView(sessionId);
}

export async function patchCartItem(
  sessionId: string,
  cartItemId: number,
  input: { quantity?: number; savedForLater?: boolean }
): Promise<CartView> {
  await prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {}
  });

  const existing = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cartSessionId: sessionId
    }
  });

  if (!existing) {
    throw new Error("CART_ITEM_NOT_FOUND");
  }

  const nextQuantity =
    input.quantity === undefined || input.quantity === null ? undefined : Number(input.quantity);

  if (nextQuantity !== undefined && nextQuantity <= 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
  } else {
    const updates: { quantity?: number; savedForLater?: boolean } = {};

    if (nextQuantity !== undefined) {
      updates.quantity = nextQuantity;
    }

    if (typeof input.savedForLater === "boolean") {
      updates.savedForLater = input.savedForLater;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("NO_CART_ITEM_PATCH_FIELDS");
    }

    await prisma.cartItem.update({
      where: { id: existing.id },
      data: updates
    });
  }

  return getCartView(sessionId);
}

export async function removeCartItem(
  sessionId: string,
  cartItemId: number
): Promise<CartView> {
  await prisma.cart.upsert({
    where: { sessionId },
    create: { sessionId },
    update: {}
  });

  await prisma.cartItem.deleteMany({
    where: {
      id: cartItemId,
      cartSessionId: sessionId
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
