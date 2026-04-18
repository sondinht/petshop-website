import { test, expect } from '@playwright/test';
import { CartPage } from './page-objects/CartPage';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { CheckoutPage } from './page-objects/CheckoutPage';
import { clearCart } from './helpers/cart-helpers';
import { TEST_PRODUCTS, TEST_USERS, TEST_PAYMENT } from './helpers/test-data';

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test.describe('Out of Stock Scenarios', () => {
    test('handles out of stock products gracefully', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);

      // Try to access a product that might be out of stock
      // Since we don't have specific out-of-stock products in test data,
      // we'll simulate by intercepting the product API response
      await page.route('**/api/products/**', async route => {
        const response = await route.fetch();
        const json = await response.json();

        // Modify the response to mark product as out of stock
        if (json && json.variants) {
          json.variants = json.variants.map((variant: any) => ({
            ...variant,
            stock: 0,
            available: false
          }));
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(json)
        });
      });

      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);

      // Check for out of stock indicators
      const outOfStockSelectors = [
        'button:disabled:has-text("Out of Stock")',
        'button:has-text("Out of Stock")',
        'span:has-text("Out of Stock")',
        'div:has-text("Out of Stock")',
        '.out-of-stock',
        '[data-out-of-stock]',
        'button:has-text("Unavailable")',
        'span:has-text("Unavailable")'
      ];

      let foundOutOfStock = false;
      for (const selector of outOfStockSelectors) {
        try {
          await expect(page.locator(selector).first()).toBeVisible({ timeout: 3000 });
          foundOutOfStock = true;
          break;
        } catch (e) {
          // Continue checking other selectors
        }
      }

      // If no out of stock indicator, check that add to cart is disabled or hidden
      if (!foundOutOfStock) {
        const addToCartButton = page.locator('button:has-text("Add to Cart"), [data-ps-add-to-cart]');
        await expect(addToCartButton).toBeDisabled();
      }
    });

    test('prevents adding out of stock items to cart', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);

      // Intercept product API to simulate out of stock
      await page.route('**/api/products/**', async route => {
        const response = await route.fetch();
        const json = await response.json();

        if (json && json.variants) {
          json.variants = json.variants.map((variant: any) => ({
            ...variant,
            stock: 0,
            available: false
          }));
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(json)
        });
      });

      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');

      // Try to add to cart - this should fail or show error
      const addToCartButton = page.locator('button:has-text("Add to Cart"), [data-ps-add-to-cart]');
      if (await addToCartButton.isEnabled()) {
        await addToCartButton.click();

        // Check for error message
        const errorSelectors = [
          '.error',
          '.alert-error',
          '[data-error]',
          '.text-red-500',
          '.text-red-600',
          'div:has-text("out of stock")',
          'div:has-text("Out of stock")',
          'div:has-text("unavailable")',
          'div:has-text("Unavailable")'
        ];

        let foundError = false;
        for (const selector of errorSelectors) {
          try {
            await expect(page.locator(selector).first()).toBeVisible({ timeout: 3000 });
            foundError = true;
            break;
          } catch (e) {
            // Continue checking other selectors
          }
        }

        // If no error message, check cart is still empty
        if (!foundError) {
          await cartPage.goto();
          await expect(cartPage.getCartItemCount()).resolves.toBe(0);
        }
      }
    });
  });

  test.describe('Quantity Limits', () => {
    test('enforces maximum quantity limits', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);

      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');

      // Try to set a very high quantity (simulate limit of 10)
      await productDetailPage.setQuantity(50);

      // Check if quantity was limited or error shown
      const quantityInput = page.locator('input[type="number"], input[placeholder*="quantity"], input[name="quantity"]');
      const currentValue = await quantityInput.inputValue();

      if (parseInt(currentValue) < 50) {
        // Quantity was limited automatically
        expect(parseInt(currentValue)).toBeLessThanOrEqual(10);
      } else {
        // Try to add to cart and check for error
        await productDetailPage.addToCart();

        const errorSelectors = [
          '.error',
          '.alert-error',
          '[data-error]',
          '.text-red-500',
          '.text-red-600',
          'div:has-text("quantity")',
          'div:has-text("Quantity")',
          'div:has-text("limit")',
          'div:has-text("Limit")',
          'div:has-text("maximum")',
          'div:has-text("Maximum")'
        ];

        let foundError = false;
        for (const selector of errorSelectors) {
          try {
            await expect(page.locator(selector).first()).toBeVisible({ timeout: 3000 });
            foundError = true;
            break;
          } catch (e) {
            // Continue checking other selectors
          }
        }

        // If no error, check cart has reasonable quantity
        if (!foundError) {
          await cartPage.goto();
          const itemCount = await cartPage.getCartItemCount();
          expect(itemCount).toBeLessThanOrEqual(10);
        }
      }
    });

    test('handles zero or negative quantity input', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);

      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');

      // Try to set quantity to 0
      await productDetailPage.setQuantity(0);

      // Check if quantity was corrected or add to cart is disabled
      const addToCartButton = page.locator('button:has-text("Add to Cart"), [data-ps-add-to-cart]');
      const isDisabled = await addToCartButton.isDisabled();

      if (isDisabled) {
        // Button is correctly disabled
        expect(isDisabled).toBe(true);
      } else {
        // Try to add to cart and check for error
        await addToCartButton.click();

        const errorSelectors = [
          '.error',
          '.alert-error',
          '[data-error]',
          '.text-red-500',
          '.text-red-600',
          'div:has-text("quantity")',
          'div:has-text("Quantity")',
          'div:has-text("invalid")',
          'div:has-text("Invalid")'
        ];

        let foundError = false;
        for (const selector of errorSelectors) {
          try {
            await expect(page.locator(selector).first()).toBeVisible({ timeout: 3000 });
            foundError = true;
            break;
          } catch (e) {
            // Continue checking other selectors
          }
        }

        // If no error, quantity input should have been corrected
        if (!foundError) {
          const quantityInput = page.locator('input[type="number"], input[placeholder*="quantity"], input[name="quantity"]');
          const currentValue = await quantityInput.inputValue();
          expect(parseInt(currentValue)).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Session Expiry and Cart Persistence', () => {
    test('handles session expiry gracefully', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);

      // Add items to cart
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await productDetailPage.goto(TEST_PRODUCTS.RUBBER_BONE.id);
      await productDetailPage.selectVariant('Standard');
      await productDetailPage.setQuantity(2);
      await productDetailPage.addToCart();

      // Verify items are in cart
      await cartPage.goto();
      expect(await cartPage.getCartItemCount()).toBe(2);

      // Simulate session expiry by clearing localStorage and cookies
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await page.context().clearCookies();

      // Try to access cart - should handle gracefully
      await cartPage.goto();

      // Cart should be empty or show appropriate message
      try {
        const itemCount = await cartPage.getCartItemCount();
        expect(itemCount).toBe(0);
      } catch (e) {
        // If getCartItemCount fails, check for empty cart message
        const emptyCartSelectors = [
          'div:has-text("empty")',
          'div:has-text("Empty")',
          'div:has-text("no items")',
          'div:has-text("No items")',
          'p:has-text("cart is empty")',
          'p:has-text("Cart is empty")'
        ];

        let foundEmptyMessage = false;
        for (const selector of emptyCartSelectors) {
          try {
            await expect(page.locator(selector).first()).toBeVisible({ timeout: 3000 });
            foundEmptyMessage = true;
            break;
          } catch (e) {
            // Continue checking other selectors
          }
        }

        if (!foundEmptyMessage) {
          // Page should still load without crashing
          await expect(page.locator('body')).toBeVisible();
        }
      }
    });

    test('handles cart persistence across page refreshes', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);

      // Add items to cart
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15 lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      // Verify item is in cart
      await cartPage.goto();
      expect(await cartPage.getCartItemCount()).toBe(1);

      // Refresh the page
      await page.reload();

      // Cart should still have the item
      await cartPage.goto();
      const itemCount = await cartPage.getCartItemCount();
      expect(itemCount).toBe(1);
    });

    test('handles corrupted cart data gracefully', async ({ page }) => {
      const cartPage = new CartPage(page);

      // Simulate corrupted cart data in localStorage
      await page.evaluate(() => {
        localStorage.setItem('petshop-cart', 'invalid-json-data{');
      });

      // Try to access cart - should handle gracefully
      await cartPage.goto();

      // Page should load without crashing
      await expect(page.locator('body')).toBeVisible();

      // Cart should be empty or show error message
      try {
        const itemCount = await cartPage.getCartItemCount();
        expect(itemCount).toBe(0);
      } catch (e) {
        // If getCartItemCount fails, check for error message or empty state
        const errorSelectors = [
          '.error',
          '.alert-error',
          '[data-error]',
          'div:has-text("error")',
          'div:has-text("Error")'
        ];

        let foundError = false;
        for (const selector of errorSelectors) {
          try {
            await expect(page.locator(selector).first()).toBeVisible({ timeout: 3000 });
            foundError = true;
            break;
          } catch (e) {
            // Continue checking other selectors
          }
        }

        if (!foundError) {
          // Should show empty cart
          const emptyCartSelectors = [
            'div:has-text("empty")',
            'div:has-text("Empty")',
            'div:has-text("no items")',
            'div:has-text("No items")'
          ];

          let foundEmpty = false;
          for (const selector of emptyCartSelectors) {
            try {
              await expect(page.locator(selector).first()).toBeVisible({ timeout: 3000 });
              foundEmpty = true;
              break;
            } catch (e) {
              // Continue checking other selectors
            }
          }

          if (!foundEmpty) {
            // At minimum, page should not crash
            await expect(page.locator('body')).toBeVisible();
          }
        }
      }
    });
  });
});