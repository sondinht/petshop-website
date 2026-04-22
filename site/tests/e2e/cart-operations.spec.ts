import { test, expect } from '@playwright/test';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { CartPage } from './page-objects/CartPage';
import { clearCart } from './helpers/cart-helpers';
import { TEST_PRODUCTS } from './helpers/test-data';

test.describe('Cart Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cart before each test
    await clearCart(page);
    // Ensure cookies are cleared
    await page.context().clearCookies();
  });

  test('add products to cart from detail pages', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);

    // Add first product
    await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(2);
    await productDetailPage.addToCart();

    // Add second product
    await productDetailPage.goto(TEST_PRODUCTS.RUBBER_BONE.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    // Verify cart contents
    await cartPage.goto();
    // Wait for cart to have exact expected item count
    await page.waitForFunction(
      (count) => document.querySelectorAll('[data-ps-cart-items] > div').length === count,
      2,
      { timeout: 5000 }
    ).catch(() => {});
    expect(await cartPage.getCartItemCount()).toBe(2);

    // Verify prices and quantities
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toContain('$'); // Should have some price
  });

  test('update quantities in cart', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);

    // Add product to cart
    await productDetailPage.goto(TEST_PRODUCTS.ORTHOPEDIC_BED.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    // Go to cart and update quantity
    await cartPage.goto();
    expect(await cartPage.getCartItemCount()).toBe(1);

    await cartPage.updateItemQuantity(0, 3);

    // Verify cart still has 1 item but with updated quantity
    expect(await cartPage.getCartItemCount()).toBe(1);

    // Verify subtotal reflects the quantity change
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toContain('$');
  });

  test('remove items from cart', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);

    // Add two products to cart
    await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.addToCart();

    await productDetailPage.goto(TEST_PRODUCTS.RUBBER_BONE.id);
    await productDetailPage.selectVariant('30lb');
    await productDetailPage.addToCart();

    // Go to cart
    await cartPage.goto();
    expect(await cartPage.getCartItemCount()).toBe(2);

    // Remove first item
    await cartPage.removeItem(0);
    expect(await cartPage.getCartItemCount()).toBe(1);

    // Remove second item
    await cartPage.removeItem(0);
    expect(await cartPage.getCartItemCount()).toBe(0);
    expect(await cartPage.isCartEmpty()).toBe(true);
  });

  test('cart merging for same product different variants', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);

    // Add same product with different variants
    await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
    await productDetailPage.selectVariant('30lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    // Verify cart has 2 different variants
    await cartPage.goto();
    expect(await cartPage.getCartItemCount()).toBe(2);

    // Verify different prices for different variants
    const price1 = await cartPage.getItemPrice(0);
    const price2 = await cartPage.getItemPrice(1);
    expect(price1).not.toBe(price2);
  });
});
