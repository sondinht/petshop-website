import { productCatalog, type Product, type ProductCategory } from "./catalog";

type CartItem = {
  productId: string;
  quantity: number;
};

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

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

export type OrderView = {
  orderNumber: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
};

const TAX_RATE = 0.08;

const carts = new Map<string, CartItem[]>();
const orders = new Map<string, OrderView[]>();

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function getOrCreateCart(sessionId: string): CartItem[] {
  let cart = carts.get(sessionId);

  if (!cart) {
    cart = [];
    carts.set(sessionId, cart);
  }

  return cart;
}

export function listProducts(category?: ProductCategory): Product[] {
  if (!category) {
    return productCatalog;
  }

  return productCatalog.filter((product) => product.category === category);
}

export function getProductById(productId: string): Product | undefined {
  return productCatalog.find((product) => product.id === productId);
}

export function addCartItem(
  sessionId: string,
  productId: string,
  quantity: number
): CartView {
  const product = getProductById(productId);

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const cart = getOrCreateCart(sessionId);
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  return getCartView(sessionId);
}

export function patchCartItem(
  sessionId: string,
  productId: string,
  quantity: number
): CartView {
  const product = getProductById(productId);

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const cart = getOrCreateCart(sessionId);
  const index = cart.findIndex((item) => item.productId === productId);

  if (index === -1) {
    throw new Error("CART_ITEM_NOT_FOUND");
  }

  if (quantity <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = quantity;
  }

  return getCartView(sessionId);
}

export function removeCartItem(sessionId: string, productId: string): CartView {
  const cart = getOrCreateCart(sessionId);
  const next = cart.filter((item) => item.productId !== productId);
  carts.set(sessionId, next);
  return getCartView(sessionId);
}

export function getCartView(sessionId: string): CartView {
  const cart = getOrCreateCart(sessionId);

  const items: CartViewItem[] = cart
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) {
        return null;
      }

      return {
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        lineTotal: toMoney(item.quantity * product.price),
        image: product.image
      };
    })
    .filter((item): item is CartViewItem => Boolean(item));

  const subtotal = toMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const tax = toMoney(subtotal * TAX_RATE);
  const total = toMoney(subtotal + tax);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    subtotal,
    tax,
    total,
    itemCount
  };
}

export function createOrder(sessionId: string): OrderView {
  const cart = getCartView(sessionId);

  if (cart.items.length === 0) {
    throw new Error("EMPTY_CART");
  }

  const order: OrderView = {
    orderNumber: createOrderNumber(),
    createdAt: new Date().toISOString(),
    items: cart.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    subtotal: cart.subtotal,
    tax: cart.tax,
    total: cart.total
  };

  const sessionOrders = orders.get(sessionId) ?? [];
  sessionOrders.unshift(order);
  orders.set(sessionId, sessionOrders);
  carts.set(sessionId, []);

  return order;
}

export function listOrders(sessionId: string): OrderView[] {
  return orders.get(sessionId) ?? [];
}

function createOrderNumber(): string {
  const time = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `PS-${time}-${rand}`;
}
