import { test, expect } from '@playwright/test';
import { CartPage } from './page-objects/CartPage';
import { CheckoutPage } from './page-objects/CheckoutPage';
import { ProfilePage } from './page-objects/ProfilePage';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { clearCart } from './helpers/cart-helpers';
import { TEST_PRODUCTS, TEST_PAYMENT, TEST_USERS } from './helpers/test-data';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test('fills shipping fields, enters payment details, and submits an order', async ({ page }) => {
    const productDetailPage = new ProductDetailPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const profilePage = new ProfilePage(page);

    await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(1);
    await productDetailPage.addToCart();

    await productDetailPage.goto(TEST_PRODUCTS.RUBBER_BONE.id);
    await productDetailPage.selectVariant('15lb');
    await productDetailPage.setQuantity(2);
    await productDetailPage.addToCart();

    await cartPage.goto();
    expect(await cartPage.getCartItemCount()).toBe(2);

    await cartPage.proceedToCheckout();

    await checkoutPage.fillShippingInfo(TEST_USERS.DEFAULT);
    await checkoutPage.fillPaymentInfo(TEST_PAYMENT.DEFAULT);

    const orderSummary = await checkoutPage.getOrderSummary();
    expect(orderSummary.items).toBeGreaterThanOrEqual(1);
    expect(orderSummary.subtotal).toContain('$');
    expect(orderSummary.total).toContain('$');

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
    expect(await profilePage.getHeroOrderNumber()).toBe(orderJson.order.orderNumber);
  });
});
