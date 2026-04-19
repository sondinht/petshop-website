import { test, expect } from '@playwright/test';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { CartPage } from './page-objects/CartPage';
import { clearCart } from './helpers/cart-helpers';
import { TEST_PRODUCTS } from './helpers/test-data';

test.describe('Cart Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await clearCart(page);
  });

  test('cart state persists across page reloads', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);

    // Add product to cart
    await productDetailPage.goto(TEST_PRODUCTS.LEATHER_HARNESS.id);
    await productDetailPage.selectVariant('Small');
    await productDetailPage.setQuantity(2);
    await productDetailPage.addToCart();

    // Go to cart and verify
    await cartPage.goto();
    expect(await cartPage.getCartItemCount()).toBe(1);

    const initialSubtotal = await cartPage.getSubtotal();

    // Reload the page
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify cart state persisted
    expect(await cartPage.getCartItemCount()).toBe(1);
    const reloadedSubtotal = await cartPage.getSubtotal();
    expect(reloadedSubtotal).toBe(initialSubtotal);
  });

  test('cart state persists across navigation', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);

    // Add product to cart
    await productDetailPage.goto(TEST_PRODUCTS.RUBBER_BONE.id);
    await productDetailPage.selectVariant('Standard');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    // Navigate to different pages
    await page.goto('/html/dogs.html');
    await page.goto('/html/accessories.html');
    await page.goto('/html/deals.html');

    // Go back to cart and verify persistence
    await cartPage.goto();
    expect(await cartPage.getCartItemCount()).toBe(1);

    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toContain('$');
  });

  test('cart state persists in new tab', async ({ page, context }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);

    // Add product to cart in first tab
    await productDetailPage.goto(TEST_PRODUCTS.ORTHOPEDIC_BED.id);
    await productDetailPage.selectVariant('Large');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    // Open new tab and check cart
    const newPage = await context.newPage();
    const newCartPage = new CartPage(newPage);

    await newCartPage.goto();
    expect(await newCartPage.getCartItemCount()).toBe(1);

    // Cleanup
    await newPage.close();
  });

  test('cart empty state persists', async ({ page }) => {
    const cartPage = new CartPage(page);

    // Verify cart is empty initially
    await cartPage.goto();
    expect(await cartPage.isCartEmpty()).toBe(true);

    // Reload and verify still empty
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await cartPage.isCartEmpty()).toBe(true);
  });
});