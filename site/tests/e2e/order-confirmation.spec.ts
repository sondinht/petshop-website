import { test, expect } from '@playwright/test';
import { CartPage } from './page-objects/CartPage';
import { CheckoutPage } from './page-objects/CheckoutPage';
import { ProfilePage } from './page-objects/ProfilePage';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { clearCart } from './helpers/cart-helpers';
import { TEST_PRODUCTS, TEST_PAYMENT, TEST_USERS } from './helpers/test-data';

test.describe('Order Confirmation', () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test('displays the submitted order number on the profile page after checkout', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const profilePage = new ProfilePage(page);

    await productDetailPage.goto(TEST_PRODUCTS.LEATHER_HARNESS.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    await cartPage.goto();
    expect(await cartPage.getCartItemCount()).toBe(1);

    await cartPage.proceedToCheckout();
    await checkoutPage.fillShippingInfo(TEST_USERS.DEFAULT);
    await checkoutPage.fillPaymentInfo(TEST_PAYMENT.DEFAULT);

    const orderResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/orders') && response.status() === 201
    );
    const paymentResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/payments/stub/charge') && response.status() === 201
    );

    await checkoutPage.placeOrder();

    const [orderJson, paymentJson] = await Promise.all([
      orderResponse.then((response) => response.json()),
      paymentResponse.then((response) => response.json())
    ]);

    expect(orderJson?.order?.orderNumber).toMatch(/^PS-/);
    expect(paymentJson?.payment?.status).toBe('SUCCEEDED');

    await expect(page).toHaveURL(/\/profile\.html$/);
    await profilePage.waitForHeroOrderNumber();

    const orderNumber = await profilePage.getHeroOrderNumber();
    expect(orderNumber).toBe(orderJson.order.orderNumber);
    expect(orderNumber).toContain('PS-');
  });

  test('preserves order totals during checkout and confirmation', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillShippingInfo(TEST_USERS.DEFAULT);
    await checkoutPage.fillPaymentInfo(TEST_PAYMENT.DEFAULT);

    const summary = await checkoutPage.getOrderSummary();
    const subtotalValue = Number(summary.subtotal.replace(/[^0-9.]/g, ''));
    const totalValue = Number(summary.total.replace(/[^0-9.]/g, ''));

    const orderResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/orders') && response.status() === 201
    );

    await checkoutPage.placeOrder();

    const orderJson = await orderResponse.then((response) => response.json());
    expect(orderJson.order.subtotal).toBeCloseTo(subtotalValue, 2);
    expect(orderJson.order.total).toBeCloseTo(totalValue, 2);
  });
});
