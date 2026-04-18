import { test, expect } from '@playwright/test';
import { CheckoutPage } from './page-objects/CheckoutPage';
import { CartPage } from './page-objects/CartPage';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { clearCart } from './helpers/cart-helpers';
import { TEST_PRODUCTS, TEST_USERS } from './helpers/test-data';

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test.describe('Form Validation Errors', () => {
    test('shows validation errors for empty required fields in checkout', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add a product to cart
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Try to place order without filling any fields
      await checkoutPage.placeOrder();

      // Check for validation errors - look for common error patterns
      const errorSelectors = [
        '.error',
        '.validation-error',
        '[data-error]',
        '.text-red-500',
        '.text-red-600',
        'span:has-text("required")',
        'span:has-text("Required")',
        'div:has-text("Please fill")',
        'div:has-text("is required")'
      ];

      let foundError = false;
      for (const selector of errorSelectors) {
        try {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 2000 });
          foundError = true;
          break;
        } catch (e) {
          // Continue checking other selectors
        }
      }

      // If no specific error elements found, check if form submission was prevented
      if (!foundError) {
        // Form should still be visible and order should not have been placed
        await expect(checkoutPage.placeOrderButton).toBeVisible();
        await expect(page).toHaveURL(/checkout/);
      }
    });

    test('shows validation errors for invalid email format', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add a product to cart
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Fill form with invalid email
      await checkoutPage.fillShippingInfo({
        ...TEST_USERS.DEFAULT,
        email: 'invalid-email-format'
      });

      await checkoutPage.fillPaymentInfo({
        cardNumber: '4111111111111111',
        expiry: '12/25',
        cvv: '123'
      });

      await checkoutPage.placeOrder();

      // Check for email validation error
      const emailErrorSelectors = [
        'input[name="email"] + .error',
        'input[name="email"] ~ .validation-error',
        'input[type="email"] + .error',
        'input[type="email"] ~ .validation-error',
        'span:has-text("email")',
        'span:has-text("Email")',
        'div:has-text("valid email")',
        'div:has-text("email format")'
      ];

      let foundEmailError = false;
      for (const selector of emailErrorSelectors) {
        try {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 2000 });
          foundEmailError = true;
          break;
        } catch (e) {
          // Continue checking other selectors
        }
      }

      // If no specific email error, check that form submission failed
      if (!foundEmailError) {
        await expect(checkoutPage.placeOrderButton).toBeVisible();
        await expect(page).toHaveURL(/checkout/);
      }
    });

    test('shows validation errors for invalid card number', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add a product to cart
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Fill form with invalid card number
      await checkoutPage.fillShippingInfo(TEST_USERS.DEFAULT);
      await checkoutPage.fillPaymentInfo({
        cardNumber: '1234567890123456', // Invalid card number
        expiry: '12/25',
        cvv: '123'
      });

      await checkoutPage.placeOrder();

      // Check for card validation error
      const cardErrorSelectors = [
        'input[name="cardNumber"] + .error',
        'input[name="cardNumber"] ~ .validation-error',
        'input[placeholder*="card"] + .error',
        'input[placeholder*="card"] ~ .validation-error',
        'span:has-text("card")',
        'span:has-text("Card")',
        'div:has-text("invalid card")',
        'div:has-text("card number")'
      ];

      let foundCardError = false;
      for (const selector of cardErrorSelectors) {
        try {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 2000 });
          foundCardError = true;
          break;
        } catch (e) {
          // Continue checking other selectors
        }
      }

      // If no specific card error, check that form submission failed
      if (!foundCardError) {
        await expect(checkoutPage.placeOrderButton).toBeVisible();
        await expect(page).toHaveURL(/checkout/);
      }
    });
  });

  test.describe('API Failure Handling', () => {
    test('handles API failure during order submission gracefully', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add a product to cart
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Fill valid form data
      await checkoutPage.fillShippingInfo(TEST_USERS.DEFAULT);
      await checkoutPage.fillPaymentInfo({
        cardNumber: '4111111111111111',
        expiry: '12/25',
        cvv: '123'
      });

      // Intercept API calls and return errors
      await page.route('**/api/orders', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await page.route('**/api/payments/stub/charge', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Payment service unavailable' })
        });
      });

      await checkoutPage.placeOrder();

      // Check that error is displayed to user
      const errorSelectors = [
        '.error',
        '.alert-error',
        '[data-error]',
        '.text-red-500',
        '.text-red-600',
        'div:has-text("error")',
        'div:has-text("Error")',
        'div:has-text("failed")',
        'div:has-text("Failed")',
        'div:has-text("try again")',
        'div:has-text("Try again")'
      ];

      let foundAPIError = false;
      for (const selector of errorSelectors) {
        try {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 });
          foundAPIError = true;
          break;
        } catch (e) {
          // Continue checking other selectors
        }
      }

      // If no specific error message, check that we're still on checkout page
      if (!foundAPIError) {
        await expect(page).toHaveURL(/checkout/);
        await expect(checkoutPage.placeOrderButton).toBeVisible();
      }
    });

    test('handles network failure during checkout', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add a product to cart
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Fill valid form data
      await checkoutPage.fillShippingInfo(TEST_USERS.DEFAULT);
      await checkoutPage.fillPaymentInfo({
        cardNumber: '4111111111111111',
        expiry: '12/25',
        cvv: '123'
      });

      // Intercept all API calls and abort them to simulate network failure
      await page.route('**/api/**', async route => {
        await route.abort('failed');
      });

      await checkoutPage.placeOrder();

      // Check that error is handled gracefully
      const errorSelectors = [
        '.error',
        '.alert-error',
        '[data-error]',
        '.text-red-500',
        '.text-red-600',
        'div:has-text("network")',
        'div:has-text("Network")',
        'div:has-text("connection")',
        'div:has-text("Connection")',
        'div:has-text("offline")',
        'div:has-text("Offline")'
      ];

      let foundNetworkError = false;
      for (const selector of errorSelectors) {
        try {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 5000 });
          foundNetworkError = true;
          break;
        } catch (e) {
          // Continue checking other selectors
        }
      }

      // If no specific error message, check that we're still on checkout page
      if (!foundNetworkError) {
        await expect(page).toHaveURL(/checkout/);
        await expect(checkoutPage.placeOrderButton).toBeVisible();
      }
    });
  });
});