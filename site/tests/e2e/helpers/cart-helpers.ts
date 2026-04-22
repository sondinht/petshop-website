import { Page } from '@playwright/test';
import { CartView } from '../../../src/server/cartRepo';

// Cart helper functions for E2E tests

async function browserFetch<T>(page: Page, url: string, method: string, body?: unknown) {
  await page.goto('/html', { waitUntil: 'domcontentloaded' });
  return page.evaluate(
    async ({ url, method, body }) => {
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      let parsedBody = null;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        parsedBody = await response.json();
      }

      return {
        ok: response.ok,
        status: response.status,
        body: parsedBody,
      } as const;
    },
    { url, method, body }
  );
}

export async function clearCart(page: Page): Promise<void> {
  try {
    const response = await browserFetch(page, '/api/cart', 'DELETE');
    if (!response.ok) {
      console.warn('Failed to clear cart via API, trying alternative method');
      await page.goto('/html/cart.html');
      const removeButtons = page.locator('button[data-ps-remove], button:has-text("Remove")');
      const count = await removeButtons.count();
      for (let i = 0; i < count; i++) {
        await removeButtons.first().click();
        await page.waitForTimeout(200);
      }
      return;
    }

    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  } catch (error) {
    console.warn('API cart clear failed, using manual method:', error);
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
    const response = await browserFetch<CartView>(page, '/api/cart', 'GET');
    if (response.ok) {
      return response.body;
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
    const response = await browserFetch(page, '/api/cart/items', 'POST', payload);
    if (!response.ok) {
      throw new Error(`Failed to add product to cart: ${response.status}`);
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
    const response = await browserFetch(page, `/api/cart/items/${itemId}`, 'PATCH', { quantity });
    if (!response.ok) {
      throw new Error(`Failed to update cart item: ${response.status}`);
    }
  } catch (error) {
    console.warn('API update cart item failed:', error);
    throw error;
  }
}

export async function removeCartItem(page: Page, itemId: number): Promise<void> {
  try {
    const response = await browserFetch(page, `/api/cart/items/${itemId}`, 'DELETE');
    if (!response.ok) {
      throw new Error(`Failed to remove cart item: ${response.status}`);
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
