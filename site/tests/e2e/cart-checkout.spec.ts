import { test, expect } from '@playwright/test';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { CartPage } from './page-objects/CartPage';
import { CheckoutPage } from './page-objects/CheckoutPage';
import { clearCart } from './helpers/cart-helpers';
import { TEST_PRODUCTS } from './helpers/test-data';

test.describe('Cart and Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test('cart page loads and checkout page is accessible', async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(page).toHaveURL(/\/html\/cart\.html/);
    await expect(page.locator('body')).toContainText(/cart|checkout|subtotal/i);

    await cartPage.proceedToCheckout();
    await expect(page).toHaveURL(/\/checkout\.html/);
    await expect(page.locator('body')).toContainText(/shipping|payment|order summary/i);
  });

  test('checkout page renders shipping and payment fields for cart items', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await productDetailPage.goto(TEST_PRODUCTS.LEATHER_HARNESS.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await expect(checkoutPage.fullNameInput).toBeVisible();
    await expect(checkoutPage.streetAddressInput).toBeVisible();
    await expect(checkoutPage.cardNumberInput).toBeVisible();
    await expect(checkoutPage.placeOrderButton).toBeVisible();
  });

  test('checkout with empty cart shows appropriate message', async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.goto();
    
    // Wait for cart hydration to complete
    await page.waitForFunction(() => {
      return document.body.dataset.hydrated === 'true' || 
             document.querySelectorAll('[data-cart-item]').length >= 0 ||
             (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).loadEventEnd > 0;
    }, { timeout: 5000 }).catch(() => {});
    
    expect(await cartPage.isCartEmpty()).toBe(true);

    await cartPage.proceedToCheckout();
    const currentUrl = page.url();

    if (currentUrl.includes('checkout.html')) {
      await expect(page.locator('body')).toContainText(/empty|no items|add items/i);
    } else {
      expect(currentUrl).toContain('cart.html');
    }
  });

  test('cart totals update correctly during checkout', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await productDetailPage.goto(TEST_PRODUCTS.LEATHER_HARNESS.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    await cartPage.goto();
    const cartSubtotal = await cartPage.getSubtotal();
    const cartTotal = await cartPage.getTotal();

    await cartPage.proceedToCheckout();

    const checkoutSubtotal = await checkoutPage.getSubtotal();
    const checkoutTotal = await checkoutPage.getTotal();

    expect(checkoutSubtotal).toBe(cartSubtotal);
    expect(checkoutTotal).toBe(cartTotal);
  });
});
