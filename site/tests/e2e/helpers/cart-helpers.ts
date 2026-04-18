import { Page } from '@playwright/test';
import { CartView } from '../../src/server/cartRepo';

// Cart helper functions for E2E tests

export async function clearCart(page: Page): Promise<void> {
  // Clear cart by making API call to delete all items
  // This assumes there's an API endpoint to clear cart
  try {
    const response = await page.request.delete('/api/cart/clear');
    if (!response.ok()) {
      console.warn('Failed to clear cart via API, trying alternative method');
      // Fallback: visit cart page and remove items manually
      await page.goto('/html/cart.html');
      const removeButtons = page.locator('button[data-ps-remove], button:has-text("Remove")');
      const count = await removeButtons.count();
      for (let i = 0; i < count; i++) {
        await removeButtons.first().click();
        await page.waitForTimeout(200);
      }
    }
  } catch (error) {
    console.warn('API cart clear failed, using manual method:', error);
    // Manual fallback
    await page.goto('/html/cart.html');
    const removeButtons = page.locator('button[data-ps-remove], button:has-text("Remove")');
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) {
      await removeButtons.first().click();
      await page.waitForTimeout(200);
    }
  }
}

export async function getCartState(page: Page): Promise<CartView | null> {
  try {
    const response = await page.request.get('/api/cart');
    if (response.ok()) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to get cart state via API:', error);
  }
  return null;
}

export async function addProductToCart(
  page: Page,
  productId: string,
  variantId?: string,
  quantity: number = 1
): Promise<void> {
  const payload = {
    productId,
    variantId: variantId || null,
    quantity,
  };

  try {
    const response = await page.request.post('/api/cart/add', {
      data: payload,
    });
    if (!response.ok()) {
      throw new Error(`Failed to add product to cart: ${response.status()}`);
    }
  } catch (error) {
    console.warn('API add to cart failed:', error);
    throw error;
  }
}

export async function updateCartItemQuantity(
  page: Page,
  itemId: number,
  quantity: number
): Promise<void> {
  try {
    const response = await page.request.patch(`/api/cart/item/${itemId}`, {
      data: { quantity },
    });
    if (!response.ok()) {
      throw new Error(`Failed to update cart item: ${response.status()}`);
    }
  } catch (error) {
    console.warn('API update cart item failed:', error);
    throw error;
  }
}

export async function removeCartItem(page: Page, itemId: number): Promise<void> {
  try {
    const response = await page.request.delete(`/api/cart/item/${itemId}`);
    if (!response.ok()) {
      throw new Error(`Failed to remove cart item: ${response.status()}`);
    }
  } catch (error) {
    console.warn('API remove cart item failed:', error);
    throw error;
  }
}

export async function getCartItemCount(page: Page): Promise<number> {
  const cartState = await getCartState(page);
  return cartState?.itemCount || 0;
}

export async function waitForCartUpdate(page: Page, timeout: number = 2000): Promise<void> {
  await page.waitForTimeout(timeout);
}

export async function ensureCartIsEmpty(page: Page): Promise<void> {
  const cartState = await getCartState(page);
  if (cartState && cartState.itemCount > 0) {
    await clearCart(page);
    await waitForCartUpdate(page);
  }
}