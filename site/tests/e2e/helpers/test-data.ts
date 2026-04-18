// Test data constants for E2E tests
// Based on seeded data from prisma/seedData/products.ts

export const TEST_PRODUCTS = {
  PREMIUM_KIBBLE: {
    id: 'premium-grain-free-kibble',
    name: 'Premium Grain-Free Kibble',
    category: 'dogs',
    variants: [
      { name: '15 lb', price: 64.99 },
      { name: '30 lb', price: 109.99 },
      { name: '50 lb', price: 149.99 },
    ],
  },
  RUBBER_BONE: {
    id: 'indestructible-rubber-bone',
    name: 'Indestructible Rubber Bone',
    category: 'dogs',
    variants: [
      { name: 'Standard', price: 18.5 },
      { name: 'Large', price: 24.5 },
    ],
  },
  ORTHOPEDIC_BED: {
    id: 'orthopedic-memory-foam-bed',
    name: 'Orthopedic Memory Foam Bed',
    category: 'dogs',
    variants: [
      { name: 'Medium', price: 129 },
      { name: 'Large', price: 159 },
    ],
  },
  LEATHER_HARNESS: {
    id: 'adjustable-leather-harness',
    name: 'Adjustable Leather Harness',
    category: 'dogs',
    variants: [
      { name: 'Small', price: 42 },
      { name: 'Large', price: 49 },
    ],
  },
} as const;

export const TEST_URLS = {
  HOME: '/html',
  DOGS: '/html/dogs.html',
  CATS: '/html/cats.html',
  ACCESSORIES: '/html/accessories.html',
  DEALS: '/html/deals.html',
  CART: '/html/cart.html',
  CHECKOUT: '/html/checkout.html',
  PRODUCT_DETAIL: '/html/product-detail.html',
} as const;

export const TEST_USERS = {
  DEFAULT: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
  },
} as const;

export const TEST_PAYMENT = {
  DEFAULT: {
    cardNumber: '4111111111111111',
    expiry: '12/25',
    cvv: '123',
  },
} as const;

// Helper function to get product by name
export function getTestProductByName(name: string) {
  return Object.values(TEST_PRODUCTS).find(product => product.name === name);
}

// Helper function to get random product
export function getRandomTestProduct() {
  const products = Object.values(TEST_PRODUCTS);
  return products[Math.floor(Math.random() * products.length)];
}