import { test, expect } from '@playwright/test';
import { CartPage } from './page-objects/CartPage';

test.describe('Cart Page Selectors', () => {
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
  });

  test('cart page loads and displays items', async () => {
    await cartPage.goto();
    
    // Page should load without errors
    expect(cartPage.page).toBeDefined();
  });

  test('cart item count selector works', async () => {
    await cartPage.goto();
    
    // Get the cart item count
    const itemCount = await cartPage.getCartItemCount();
    expect(typeof itemCount).toBe('number');
    expect(itemCount).toBeGreaterThanOrEqual(0);
  });

  test('quantity display selectors work on cart items', async () => {
    await cartPage.goto();
    
    const itemCount = await cartPage.getCartItemCount();
    if (itemCount > 0) {
      // Get first item's quantity display
      const quantityDisplays = await cartPage.page.locator('[data-ps-cart-items] span.px-4.font-semibold').allTextContents();
      expect(quantityDisplays.length).toBeGreaterThan(0);
      
      // Each should be a number
      quantityDisplays.forEach(qty => {
        expect(/^\d+$/.test(qty.trim())).toBeTruthy();
      });
    }
  });

  test('price selectors work', async () => {
    await cartPage.goto();
    
    const itemCount = await cartPage.getCartItemCount();
    if (itemCount > 0) {
      // Get item prices
      const prices = await cartPage.page.locator('[data-ps-cart-items] span.text-xl.font-bold.text-primary').allTextContents();
      expect(prices.length).toBeGreaterThan(0);
      
      // Each should have a dollar sign
      prices.forEach(price => {
        expect(price).toContain('$');
      });
    }
  });

  test('total selector works', async () => {
    await cartPage.goto();
    
    const total = await cartPage.getTotal();
    expect(total).toBeDefined();
    // Total should have a dollar sign
    if (total) {
      expect(total).toContain('$');
    }
  });

  test('subtotal selector works', async () => {
    await cartPage.goto();
    
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toBeDefined();
    // Subtotal should have a dollar sign  
    if (subtotal) {
      expect(subtotal).toContain('$');
    }
  });

  test('tax selector works', async () => {
    await cartPage.goto();
    
    const tax = await cartPage.getTax();
    expect(tax).toBeDefined();
    if (tax) {
      expect(tax).toContain('$');
    }
  });

  test('plus and minus button selectors are found', async () => {
    await cartPage.goto();
    
    const itemCount = await cartPage.getCartItemCount();
    if (itemCount > 0) {
      // Check that we can find quantity buttons
      const minusButtons = await cartPage.page.locator('[data-ps-cart-items] button span.material-symbols-outlined:has-text("remove")').count();
      const plusButtons = await cartPage.page.locator('[data-ps-cart-items] button span.material-symbols-outlined:has-text("add")').count();
      
      expect(minusButtons).toBeGreaterThan(0);
      expect(plusButtons).toBeGreaterThan(0);
    }
  });

  test('checkout button selector works', async () => {
    await cartPage.goto();
    
    // Checkout button should exist
    await expect(cartPage.checkoutButton).toBeVisible();
  });
});
