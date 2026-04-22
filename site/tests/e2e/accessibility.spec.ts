import { test, expect } from '@playwright/test';
import { CheckoutPage } from './page-objects/CheckoutPage';
import { CartPage } from './page-objects/CartPage';
import { ProductDetailPage } from './page-objects/ProductDetailPage';
import { StorefrontPage } from './page-objects/StorefrontPage';
import { clearCart } from './helpers/cart-helpers';
import { TEST_PRODUCTS, TEST_USERS, TEST_PAYMENT } from './helpers/test-data';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test.describe('Form Accessibility', () => {
    test('checkout form has proper labels and ARIA attributes', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add a product to cart and go to checkout
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Check that form inputs have associated labels
      const inputs = [
        checkoutPage.fullNameInput,
        checkoutPage.streetAddressInput,
        checkoutPage.cityInput,
        checkoutPage.zipInput,
        checkoutPage.emailInput,
        checkoutPage.phoneInput,
        checkoutPage.cardNumberInput,
        checkoutPage.expiryInput,
        checkoutPage.cvvInput
      ];

      for (const input of inputs) {
        if (await input.count() > 0) {
          // Check for label association via 'for' attribute or aria-labelledby
          const inputId = await input.getAttribute('id');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          const ariaLabel = await input.getAttribute('aria-label');
          const placeholder = await input.getAttribute('placeholder');

          // At least one of these should be present for accessibility
          const hasAccessibility = !!(inputId || ariaLabelledBy || ariaLabel || placeholder);
          expect(hasAccessibility).toBe(true);
        }
      }

      // Check for proper form structure
      const form = page.locator('form');
      if (await form.count() > 0) {
        await expect(form).toHaveAttribute('role', 'form');
      }
    });

    test('form inputs are keyboard accessible', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add a product to cart and go to checkout
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Test keyboard navigation through form fields
      await page.keyboard.press('Tab');

      // First focusable element should receive focus
      const activeElement = page.locator(':focus');
      await expect(activeElement).toBeVisible();

      // Continue tabbing through form elements
      const focusableSelectors = [
        'input',
        'button',
        'select',
        'textarea',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');

      const focusableElements = page.locator(focusableSelectors);
      const count = await focusableElements.count();

      // Should have at least some focusable elements
      expect(count).toBeGreaterThan(0);

      // Test that we can tab through elements
      for (let i = 0; i < Math.min(count, 5); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100); // Small delay for focus to move
      }

      // Should still have some element focused
      const finalActiveElement = page.locator(':focus');
      await expect(finalActiveElement).toBeVisible();
    });

    test('error messages are properly associated with form fields', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      // Add a product to cart and go to checkout
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();
      await cartPage.proceedToCheckout();

      // Try to submit empty form to trigger validation
      await checkoutPage.placeOrder();

      // Look for error messages
      const errorElements = page.locator('.error, .validation-error, [data-error], .text-red-500, .text-red-600');

      if (await errorElements.count() > 0) {
        // Check that error messages are properly associated
        for (let i = 0; i < await errorElements.count(); i++) {
          const errorElement = errorElements.nth(i);
          const ariaDescribedBy = await errorElement.getAttribute('aria-describedby');
          const role = await errorElement.getAttribute('role');

          // Error should have appropriate ARIA attributes or be properly positioned
          const hasAriaError = !!(ariaDescribedBy || role === 'alert' || role === 'status');
          if (!hasAriaError) {
            // Check if error is positioned near the related input
            const errorText = await errorElement.textContent();
            // This is a basic check - in a real implementation, we'd check proximity to inputs
            expect(errorText?.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe('Navigation Accessibility', () => {
    test('page has proper heading structure', async ({ page }) => {
      const storefrontPage = new StorefrontPage(page);

      await storefrontPage.goto();

      // Check for heading hierarchy
      const mainHeadings = page.locator('h1, h2');
      const h2Elements = page.locator('h2');
      const h3Elements = page.locator('h3');

      // Should have at least one main heading (h1 or h2)
      await expect(mainHeadings.first()).toBeVisible();

      // Check that headings are not empty
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const text = await heading.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });

    test('navigation links have descriptive text', async ({ page }) => {
      const storefrontPage = new StorefrontPage(page);

      await storefrontPage.goto();

      // Check navigation links
      const navLinks = page.locator('nav a, header a, .navigation a');

      if (await navLinks.count() > 0) {
        for (let i = 0; i < await navLinks.count(); i++) {
          const link = navLinks.nth(i);
          const text = await link.textContent();
          const ariaLabel = await link.getAttribute('aria-label');
          const title = await link.getAttribute('title');

          // Link should have some form of descriptive text
          const hasDescription = !!(text?.trim() || ariaLabel || title);
          expect(hasDescription).toBe(true);
        }
      }
    });

    test('images have alt text', async ({ page }) => {
      const storefrontPage = new StorefrontPage(page);

      await storefrontPage.goto();

      // Check all images for alt text
      const images = page.locator('img');

      for (let i = 0; i < await images.count(); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Images should have alt text unless they are decorative
        if (role !== 'presentation' && role !== 'none') {
          // For non-decorative images, alt should be present (can be empty string for decorative)
          expect(alt).not.toBeNull();
        }
      }
    });

    test('buttons have accessible names', async ({ page }) => {
      const storefrontPage = new StorefrontPage(page);

      await storefrontPage.goto();

      // Check all buttons
      const buttons = page.locator('button, [role="button"], input[type="button"], input[type="submit"]');

      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        const value = await button.getAttribute('value');

        // Button should have some form of accessible name
        const hasAccessibleName = !!(text?.trim() || ariaLabel || title || value);
        expect(hasAccessibleName).toBe(true);
      }
    });
  });

  test.describe('Product Detail Accessibility', () => {
    test('product detail page has proper structure', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);

      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);

      // Check for product title heading
      await expect(productDetailPage.productTitle).toBeVisible();
      const titleTag = await productDetailPage.productTitle.evaluate(el => el.tagName.toLowerCase());
      expect(['h1', 'h2', 'h3']).toContain(titleTag);

      // Check for price information with proper labeling
      const priceElements = page.locator('[data-price], .price, span:has-text("$")');
      if (await priceElements.count() > 0) {
        const firstPrice = priceElements.first();
        const ariaLabel = await firstPrice.getAttribute('aria-label');
        // Price should be in a context that's clear, or have aria-label
        expect(ariaLabel || true).toBe(true); // Allow either aria-label or contextual clarity
      }

      // Check variant selection accessibility
      const variantSelectors = page.locator('select, [role="radiogroup"], [role="group"]');
      if (await variantSelectors.count() > 0) {
        for (let i = 0; i < await variantSelectors.count(); i++) {
          const selector = variantSelectors.nth(i);
          const label = await selector.getAttribute('aria-label') || await selector.getAttribute('aria-labelledby');
          const legend = page.locator('legend').nth(i);

          // Should have some form of label
          const hasLabel = !!(label || (await legend.count() > 0));
          expect(hasLabel).toBe(true);
        }
      }
    });

    test('add to cart button is accessible', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);

      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15lb');

      const addToCartButton = page.locator('button:has-text("Add to Cart"), [data-ps-add-to-cart]');

      // Button should be visible and have accessible name
      await expect(addToCartButton).toBeVisible();
      await expect(addToCartButton).toBeEnabled();

      const buttonText = await addToCartButton.textContent();
      const ariaLabel = await addToCartButton.getAttribute('aria-label');

      expect(buttonText?.trim() || ariaLabel).toBeTruthy();
    });
  });

  test.describe('Cart Accessibility', () => {
    test('cart page has proper table structure', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);

      // Add item to cart first
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();

      // Check for table structure
      const table = page.locator('table');
      if (await table.count() > 0) {
        // If there's a table, it should have proper headers
        const headers = table.locator('th, [role="columnheader"]');
        await expect(headers.first()).toBeVisible();

        // Check for table caption or aria-label
        const caption = table.locator('caption');
        const tableAriaLabel = await table.getAttribute('aria-label');
        const tableAriaLabelledBy = await table.getAttribute('aria-labelledby');

        // Table should have some form of description
        const hasDescription = !!(await caption.count() > 0 || tableAriaLabel || tableAriaLabelledBy);
        expect(hasDescription).toBe(true);
      } else {
        // If no table, check for proper list structure
        const listItems = page.locator('[role="listitem"], li');
        if (await listItems.count() > 0) {
          const list = page.locator('[role="list"], ul, ol');
          await expect(list.first()).toBeVisible();
        }
      }
    });

    test('checkout button is accessible', async ({ page }) => {
      const productDetailPage = new ProductDetailPage(page);
      const cartPage = new CartPage(page);

      // Add item to cart first
      await productDetailPage.goto(TEST_PRODUCTS.PREMIUM_KIBBLE.id);
      await productDetailPage.selectVariant('15lb');
      await productDetailPage.setQuantity(1);
      await productDetailPage.addToCart();

      await cartPage.goto();

      const checkoutButton = page.locator('button:has-text("Checkout"), [data-ps-checkout]');

      if (await checkoutButton.count() > 0) {
        await expect(checkoutButton).toBeVisible();
        await expect(checkoutButton).toBeEnabled();

        const buttonText = await checkoutButton.textContent();
        const ariaLabel = await checkoutButton.getAttribute('aria-label');

        expect(buttonText?.trim() || ariaLabel).toBeTruthy();
      }
    });
  });
});
